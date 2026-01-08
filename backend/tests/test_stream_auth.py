
import pytest
from httpx import AsyncClient
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.song import Song
from app.models.user import User

@pytest.mark.asyncio
async def test_stream_song_with_query_token(
    client: AsyncClient,
    test_user: User,
    test_song: Song,
    auth_token: str,
):
    """Test streaming song with token in query parameter."""
    
    # We expect 404 because the actual file doesn't exist on disk, 
    # but we want to ensure we pass the auth check (so not 401/403).
    # If auth fails, it returns 401.
    # If auth succeeds but song/file not found, it returns 404.
    
    response = await client.get(
        f"/api/v1/songs/{test_song.id}/stream?token={auth_token}"
    )

    # We expect 404 because the file is not actually on disk in the test environment
    # unless we mock StorageService or create the file.
    # But getting 404 means we passed authentication!
    # If we were unauthorized, we would get 401.
    
    assert response.status_code != 401
    assert response.status_code != 403
    
    # If we want to be more specific, we can check for 404 (File not found)
    # The song exists in DB (test_song fixture), but file_path points to /tmp/...
    # which might not exist.
    
    # Let's verify what happens if we don't provide token
    response_no_auth = await client.get(
        f"/api/v1/songs/{test_song.id}/stream"
    )
    assert response_no_auth.status_code == 401

