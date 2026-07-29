"""add_play_history_listened_seconds

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-07-29 15:20:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "play_history",
        sa.Column(
            "listened_seconds",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )
    # Previous logic credited the full track duration on every play start,
    # which inflated totals. Reset so real listening data can accumulate.
    op.execute("UPDATE users SET total_listen_seconds = 0")


def downgrade() -> None:
    op.drop_column("play_history", "listened_seconds")
