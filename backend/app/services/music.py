"""Music service with business logic for song management."""

from pathlib import Path
from typing import IO
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.song import Song
from app.schemas.song import SongFilters, SongUpdate
from app.services.metadata import MetadataExtractor
from app.services.storage import StorageService


class MusicServiceError(Exception):
    """Base exception for music service errors."""


class SongNotFoundError(MusicServiceError):
    """Raised when song is not found."""


class UploadError(MusicServiceError):
    """Raised when upload fails."""


class MusicService:
    """Service for managing music/songs."""

    def __init__(
        self,
        db: AsyncSession,
        storage: StorageService | None = None,
        metadata_extractor: MetadataExtractor | None = None,
    ) -> None:
        """Initialize music service.

        Args:
            db: Database session.
            storage: Storage service for file operations.
            metadata_extractor: Service for extracting audio metadata.
        """
        self.db = db
        self.storage = storage or StorageService()
        self.metadata_extractor = metadata_extractor or MetadataExtractor()

    async def get_song_by_id(self, song_id: UUID, owner_id: UUID) -> Song | None:
        """Get a song by ID.

        Args:
            song_id: Song UUID.
            owner_id: Owner UUID.

        Returns:
            Song if found, None otherwise.
        """
        result = await self.db.execute(
            select(Song).where(Song.id == song_id, Song.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def get_songs(
        self,
        owner_id: UUID,
        filters: SongFilters,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Song], int]:
        """Get songs with pagination and filters.

        Args:
            owner_id: Owner UUID.
            filters: Filter parameters.
            page: Page number (1-based).
            limit: Items per page.

        Returns:
            Tuple of (songs list, total count).
        """
        # Base query
        query = select(Song).where(Song.owner_id == owner_id)

        # Apply search filter
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    Song.title.ilike(search_term),
                    Song.artist.ilike(search_term),
                    Song.album.ilike(search_term),
                )
            )

        # Apply exact filters
        if filters.artist:
            query = query.where(Song.artist == filters.artist)
        if filters.album:
            query = query.where(Song.album == filters.album)
        if filters.genre:
            query = query.where(Song.genre == filters.genre)
        if filters.is_favorite is not None:
            query = query.where(Song.is_favorite == filters.is_favorite)
        if filters.year_from is not None:
            query = query.where(Song.year >= filters.year_from)
        if filters.year_to is not None:
            query = query.where(Song.year <= filters.year_to)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Apply sorting
        sort_column = getattr(Song, filters.sort, Song.created_at)
        if filters.order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        # Execute query
        result = await self.db.execute(query)
        songs = list(result.scalars().all())

        return songs, total

    async def upload_song(
        self,
        owner_id: UUID,
        file: IO[bytes],
        filename: str,
        content_type: str | None = None,
        override_title: str | None = None,
        override_artist: str | None = None,
        override_album: str | None = None,
    ) -> Song:
        """Upload and process a new song.

        Args:
            owner_id: Owner UUID.
            file: File-like object with audio data.
            filename: Original filename.
            content_type: MIME content type.
            override_title: Override extracted title.
            override_artist: Override extracted artist.
            override_album: Override extracted album.

        Returns:
            Created song.

        Raises:
            UploadError: If upload fails.
        """
        try:
            # Save file
            file_path, file_format, file_size = await self.storage.save_audio_file(
                file, owner_id, filename, content_type
            )

            # Extract metadata
            metadata = self.metadata_extractor.extract(file_path)

            # Save cover art if present
            cover_art_path = None
            if metadata.cover_art:
                cover_format = "jpg"
                if metadata.cover_art_mime and "png" in metadata.cover_art_mime.lower():
                    cover_format = "png"
                cover_art_path = await self.storage.save_cover_art(
                    metadata.cover_art, owner_id, cover_format
                )

            # Determine title (use filename without extension if no title)
            title = override_title or metadata.title or Path(filename).stem

            # Create song record
            song = Song(
                owner_id=owner_id,
                title=title,
                artist=override_artist or metadata.artist,
                album=override_album or metadata.album,
                album_artist=metadata.album_artist,
                genre=metadata.genre,
                year=metadata.year,
                track_number=metadata.track_number,
                disc_number=metadata.disc_number or 1,
                duration_seconds=metadata.duration_seconds,
                file_path=file_path,
                file_size_bytes=file_size,
                file_format=file_format,
                bitrate=metadata.bitrate,
                sample_rate=metadata.sample_rate,
                cover_art_path=cover_art_path,
                lyrics=metadata.lyrics,
                bpm=metadata.bpm,
            )

            self.db.add(song)
            await self.db.flush()

            return song

        except Exception as e:
            raise UploadError(f"Failed to upload song: {e}") from e

    async def update_song(
        self,
        song_id: UUID,
        owner_id: UUID,
        update_data: SongUpdate,
    ) -> Song:
        """Update song metadata.

        Args:
            song_id: Song UUID.
            owner_id: Owner UUID.
            update_data: Update data.

        Returns:
            Updated song.

        Raises:
            SongNotFoundError: If song not found.
        """
        song = await self.get_song_by_id(song_id, owner_id)
        if not song:
            raise SongNotFoundError(f"Song not found: {song_id}")

        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(song, field, value)

        await self.db.flush()
        return song

    async def delete_song(self, song_id: UUID, owner_id: UUID) -> None:
        """Delete a song and its files.

        Args:
            song_id: Song UUID.
            owner_id: Owner UUID.

        Raises:
            SongNotFoundError: If song not found.
        """
        song = await self.get_song_by_id(song_id, owner_id)
        if not song:
            raise SongNotFoundError(f"Song not found: {song_id}")

        # Delete files
        await self.storage.delete_file(song.file_path)
        if song.cover_art_path:
            await self.storage.delete_file(song.cover_art_path)

        # Delete from database
        await self.db.delete(song)
        await self.db.flush()

    async def increment_play_count(self, song_id: UUID, owner_id: UUID) -> Song:
        """Increment song play count.

        Args:
            song_id: Song UUID.
            owner_id: Owner UUID.

        Returns:
            Updated song.

        Raises:
            SongNotFoundError: If song not found.
        """
        from datetime import UTC, datetime

        song = await self.get_song_by_id(song_id, owner_id)
        if not song:
            raise SongNotFoundError(f"Song not found: {song_id}")

        song.play_count += 1
        song.last_played_at = datetime.now(UTC)
        await self.db.flush()

        return song
