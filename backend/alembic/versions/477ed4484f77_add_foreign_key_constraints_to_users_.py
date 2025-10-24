"""Add foreign key constraints to users table

Revision ID: 477ed4484f77
Revises: 6fa2bcca9076
Create Date: 2025-10-24 22:25:22.677564

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '477ed4484f77'
down_revision: Union[str, Sequence[str], None] = '6fa2bcca9076'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, handle orphaned records by creating placeholder users or setting NULL

    # Create placeholder users for orphaned patient_ids
    op.execute("""
        INSERT INTO users (id, name, email, role, is_active)
        SELECT DISTINCT
            patient_id,
            'Migrated Patient ' || LEFT(patient_id::text, 8) as name,
            'patient-' || LEFT(patient_id::text, 8) || '@example.com' as email,
            'PATIENT'::user_role as role,
            true as is_active
        FROM patient_visit_sessions
        WHERE patient_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = patient_visit_sessions.patient_id)
        ON CONFLICT (id) DO NOTHING;
    """)

    # Create placeholder users for orphaned professional_ids
    op.execute("""
        INSERT INTO users (id, name, email, role, is_active)
        SELECT DISTINCT
            professional_id,
            'Migrated Professional ' || LEFT(professional_id::text, 8) as name,
            'professional-' || LEFT(professional_id::text, 8) || '@example.com' as email,
            'PROFESSIONAL'::user_role as role,
            true as is_active
        FROM patient_visit_sessions
        WHERE professional_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = patient_visit_sessions.professional_id)
        ON CONFLICT (id) DO NOTHING;
    """)

    # Create placeholder users for orphaned professional_ids in session_soap_notes
    op.execute("""
        INSERT INTO users (id, name, email, role, is_active)
        SELECT DISTINCT
            professional_id,
            'Migrated Professional ' || LEFT(professional_id::text, 8) as name,
            'professional-' || LEFT(professional_id::text, 8) || '@example.com' as email,
            'PROFESSIONAL'::user_role as role,
            true as is_active
        FROM session_soap_notes
        WHERE professional_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = session_soap_notes.professional_id)
        ON CONFLICT (id) DO NOTHING;
    """)

    # Now add foreign key constraints safely
    # Foreign key constraint for patient_visit_sessions.patient_id
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_patient_visit_sessions_patient_id'
                AND table_name = 'patient_visit_sessions'
            ) THEN
                ALTER TABLE patient_visit_sessions
                ADD CONSTRAINT fk_patient_visit_sessions_patient_id
                FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE RESTRICT;
            END IF;
        END $$;
    """)

    # Foreign key constraint for patient_visit_sessions.professional_id
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_patient_visit_sessions_professional_id'
                AND table_name = 'patient_visit_sessions'
            ) THEN
                ALTER TABLE patient_visit_sessions
                ADD CONSTRAINT fk_patient_visit_sessions_professional_id
                FOREIGN KEY (professional_id) REFERENCES users (id) ON DELETE SET NULL;
            END IF;
        END $$;
    """)

    # Foreign key constraint for session_soap_notes.professional_id
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_session_soap_notes_professional_id'
                AND table_name = 'session_soap_notes'
            ) THEN
                ALTER TABLE session_soap_notes
                ADD CONSTRAINT fk_session_soap_notes_professional_id
                FOREIGN KEY (professional_id) REFERENCES users (id) ON DELETE SET NULL;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign key constraints
    op.execute("ALTER TABLE patient_visit_sessions DROP CONSTRAINT IF EXISTS fk_patient_visit_sessions_patient_id;")
    op.execute("ALTER TABLE patient_visit_sessions DROP CONSTRAINT IF EXISTS fk_patient_visit_sessions_professional_id;")
    op.execute("ALTER TABLE session_soap_notes DROP CONSTRAINT IF EXISTS fk_session_soap_notes_professional_id;")
