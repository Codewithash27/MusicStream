"""create_musicstream_core_tables

Revision ID: d5f0bdeb8b17
Revises:
Create Date: 2026-07-27
"""

from alembic import op
import sqlalchemy as sa

revision = "d5f0bdeb8b17"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column(
            "role",
            sa.Enum("USER", "ARTIST", "ADMIN", name="user_role"),
            server_default="USER",
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "artist_profiles",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("stage_name", sa.String(length=100), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_artist_profiles_stage_name"),
        "artist_profiles",
        ["stage_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_artist_profiles_user_id"),
        "artist_profiles",
        ["user_id"],
        unique=True,
    )

    op.create_table(
        "playlists",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_url", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_playlists_name"), "playlists", ["name"], unique=False)
    op.create_index(op.f("ix_playlists_user_id"), "playlists", ["user_id"], unique=False)

    op.create_table(
        "albums",
        sa.Column("artist_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_url", sa.Text(), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["artist_id"],
            ["artist_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_albums_artist_id"), "albums", ["artist_id"], unique=False)
    op.create_index(op.f("ix_albums_title"), "albums", ["title"], unique=False)

    op.create_table(
        "songs",
        sa.Column("artist_id", sa.UUID(), nullable=False),
        sa.Column("album_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("audio_url", sa.Text(), nullable=False),
        sa.Column("cover_url", sa.Text(), nullable=True),
        sa.Column("track_number", sa.Integer(), nullable=True),
        sa.Column("play_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["album_id"], ["albums.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["artist_id"],
            ["artist_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_songs_album_id"), "songs", ["album_id"], unique=False)
    op.create_index(op.f("ix_songs_artist_id"), "songs", ["artist_id"], unique=False)
    op.create_index(op.f("ix_songs_title"), "songs", ["title"], unique=False)

    op.create_table(
        "likes",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("song_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "song_id", name="uq_likes_user_song"),
    )
    op.create_index(op.f("ix_likes_song_id"), "likes", ["song_id"], unique=False)
    op.create_index(op.f("ix_likes_user_id"), "likes", ["user_id"], unique=False)

    op.create_table(
        "playlist_songs",
        sa.Column("playlist_id", sa.UUID(), nullable=False),
        sa.Column("song_id", sa.UUID(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["playlist_id"], ["playlists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["song_id"], ["songs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "playlist_id",
            "position",
            name="uq_playlist_songs_playlist_position",
        ),
        sa.UniqueConstraint(
            "playlist_id",
            "song_id",
            name="uq_playlist_songs_playlist_song",
        ),
    )
    op.create_index(
        op.f("ix_playlist_songs_playlist_id"),
        "playlist_songs",
        ["playlist_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_playlist_songs_song_id"),
        "playlist_songs",
        ["song_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_playlist_songs_song_id"), table_name="playlist_songs")
    op.drop_index(op.f("ix_playlist_songs_playlist_id"), table_name="playlist_songs")
    op.drop_table("playlist_songs")
    op.drop_index(op.f("ix_likes_user_id"), table_name="likes")
    op.drop_index(op.f("ix_likes_song_id"), table_name="likes")
    op.drop_table("likes")
    op.drop_index(op.f("ix_songs_title"), table_name="songs")
    op.drop_index(op.f("ix_songs_artist_id"), table_name="songs")
    op.drop_index(op.f("ix_songs_album_id"), table_name="songs")
    op.drop_table("songs")
    op.drop_index(op.f("ix_albums_title"), table_name="albums")
    op.drop_index(op.f("ix_albums_artist_id"), table_name="albums")
    op.drop_table("albums")
    op.drop_index(op.f("ix_playlists_user_id"), table_name="playlists")
    op.drop_index(op.f("ix_playlists_name"), table_name="playlists")
    op.drop_table("playlists")
    op.drop_index(op.f("ix_artist_profiles_user_id"), table_name="artist_profiles")
    op.drop_index(op.f("ix_artist_profiles_stage_name"), table_name="artist_profiles")
    op.drop_table("artist_profiles")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)
