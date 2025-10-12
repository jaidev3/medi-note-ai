"""
Professional Management Routes
HTTP endpoints for professional management
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.user_schemas import ProfessionalListResponse
from app.controllers.user_controller import UserController
from app.routes.auth_routes import get_current_user_dependency
from app.schemas.auth_schemas import UserRead

# Create router
router = APIRouter()

# Placeholder: professionals listing route has been moved to `user_routes.py` under the
# users router (path: /users/). This file remains to preserve imports that may
# reference the `professional_routes` module. Remove this file and update
# `app.main` if you want to fully delete the professionals router.
