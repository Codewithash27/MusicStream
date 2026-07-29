"""add_play_history_table

Revision ID: a1b2c3d4e5f6
Revises: daf89a1a8e6b
Create Date: 2026-07-29 12:10:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "daf89a1a8e6b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "play_history",
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
        sa.UniqueConstraint("user_id", "song_id", name="uq_play_history_user_song"),
    )
    op.create_index(op.f("ix_play_history_song_id"), "play_history", ["song_id"], unique=False)
    op.create_index(op.f("ix_play_history_user_id"), "play_history", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_play_history_user_id"), table_name="play_history")
    op.drop_index(op.f("ix_play_history_song_id"), table_name="play_history")
    op.drop_table("play_history")
