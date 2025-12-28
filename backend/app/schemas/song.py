"""Song schemas for request/response validation."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SongBase(BaseModel):
    """Base song schema with common fields."""

    title: str = Field(max_length=255)
    artist: str | None = Field(default=None, max_length=255)
    album: str | None = Field(default=None, max_length=255)
    genre: str | None = Field(default=None, max_length=100)
    year: int | None = Field(default=None, ge=1000, le=9999)


class SongUpdate(BaseModel):
    """Schema for updating song metadata."""

    title: str | None = Field(default=None, max_length=255)
    artist: str | None = Field(default=None, max_length=255)
    album: str | None = Field(default=None, max_length=255)
    genre: str | None = Field(default=None, max_length=100)
    year: int | None = Field(default=None, ge=1000, le=9999)
    lyrics: str | None = None
    is_favorite: bool | None = None
    rating: int | None = Field(default=None, ge=1, le=5)


class SongResponse(BaseModel):
    """Schema for song response (list view)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    artist: str | None
    album: str | None
    genre: str | None
    year: int | None
    duration_seconds: int
    file_format: str
    play_count: int
    last_played_at: datetime | None
    is_favorite: bool
    rating: int | None
    cover_art_path: str | None
    created_at: datetime


class SongDetailResponse(SongResponse):
    """Schema for detailed song response."""

    model_config = ConfigDict(from_attributes=True)

    album_artist: str | None
    track_number: int | None
    disc_number: int | None
    file_size_bytes: int
    bitrate: int | None
    sample_rate: int | None
    lyrics: str | None
    bpm: int | None
    energy: float | None
    valence: float | None


class SongUploadResponse(BaseModel):
    """Schema for song upload response."""

    id: UUID
    title: str
    artist: str | None
    status: str = "uploaded"
    message: str = "File uploaded successfully"


class SongBatchUploadResponse(BaseModel):
    """Schema for batch upload response."""

    songs: list[SongUploadResponse]
    errors: list[dict[str, str]]
    total_files: int
    successful: int
    failed: int


class SongListResponse(BaseModel):
    """Schema for paginated song list response."""

    items: list[SongResponse]
    total: int
    page: int
    limit: int
    pages: int


class PaginationParams(BaseModel):
    """Schema for pagination query parameters."""

    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class SongFilters(BaseModel):
    """Schema for song filtering parameters."""

    search: str | None = None
    artist: str | None = None
    album: str | None = None
    genre: str | None = None
    is_favorite: bool | None = None
    year_from: int | None = None
    year_to: int | None = None
    sort: str = Field(
        default="created_at",
        pattern=r"^(title|artist|album|created_at|play_count|last_played_at)$",
    )
    order: str = Field(default="desc", pattern=r"^(asc|desc)$")
