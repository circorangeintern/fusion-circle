# ResultTrack API Documentation

**ResultTrack** is a school results platform designed to replace manual paper- and Excel-based grading with an automated, real-time system. It enables teachers to enter and finalize scores quickly, while giving students immediate visibility into their finalized grades as they're submitted—not just at the end of the term.

The platform supports secondary and tertiary students at a single school, with secure PIN-gated registration, password-based login, automated grade computation (configurable weighting), and a student flagging feature to report suspected scoring errors directly to the owning teacher. It prioritizes trust, transparency, and efficiency.

---

## Authentication & Authorization

ResultTrack uses **Cookie-based Session Authentication** (via `express-session` cookies). 
* **No Manual Headers Required:** Once you call the login route successfully, Postman/your browser will automatically store and send back the session cookie (`connect.sid`) in subsequent requests.
* **Role-Based Access Control (RBAC):** Users are assigned roles (e.g., `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`) which restrict access to specific routes based on permissions.

---

## API Reference & Testing

### 📄 API Contract (Swagger Docs)
For the exact request and response schemas for all **developed routes**, refer to the interactive API contract at:

> **[https://resulttrack-backend.onrender.com/docs](https://resulttrack-backend.onrender.com/docs)**

This Swagger UI documents all available endpoints with their expected request bodies, query parameters, response formats, and status codes.

---

### 🧪 Testing with Postman
To test the API routes locally or on the production server:

1. Open **Postman**.
2. Click **Import** (top-left corner).
3. Select the collection file: `development/fusion_circle_routes.postman_collection.json` from this repository.
4. Once imported, set up your environment:
   - **Local:** Set `baseUrl` to `http://localhost:5000/api/v1`
   - **Production:** Set `baseUrl` to `https://resulttrack-backend.onrender.com/api/v1`
5. Log in via `POST /auth/login` or `POST /superAdmin/login` first — Postman will automatically store the session cookie for subsequent requests.

> **Note:** Routes marked as *"currently in development"* will return a descriptive message but have no real logic yet. Only routes **without** this label are fully implemented.

---

## API Endpoints List

All routes are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/auth/login` | Logs in a user (Admin, Teacher, or Student) and creates a session cookie. |
| **POST** | `/auth/logout` | Logs out the current user and invalidates the session. |
| **POST** | `/auth/forgot-password` | Initiates the forgot password flow by sending a reset email. |
| **POST** | `/auth/reset-password` | Resets a user's password using a verification token. |

---

### 2. Super-Admin (`/api/v1/superAdmin`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/superAdmin/login` | Logs in a Super-Admin. |
| **POST** | `/superAdmin/logout` | Logs out the Super-Admin. |
| **POST** | `/superAdmin/admin` | Creates a new school Admin account. |
| **GET** | `/superAdmin/admins` | Lists all created Admin accounts. |
| **GET** | `/superAdmin/admins/:id` | Retrieves detailed information of a specific Admin. |
| **PATCH** | `/superAdmin/admins/:id` | Deactivates/deletes an Admin account. |
| **PATCH** | `/superAdmin/admins/:id/activate` | *Placeholder:* Re-activates a deactivated Admin account. |
| **PATCH** | `/superAdmin/admins/:id/deactivate` | *Placeholder:* Deactivates an Admin account. |

---

### 3. School Admin (`/api/v1/admin`)

#### School Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/schools` | Creates/registers a new school profile. |
| **PATCH** | `/admin/schools/:pin` | Updates an existing school profile using its unique PIN. |
| **GET** | `/admin/schools` | *Placeholder:* Lists all registered schools. |
| **GET** | `/admin/schools/:pin` | *Placeholder:* Retrieves details of a specific school by PIN. |

#### Student Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/students` | *Placeholder:* Registers a single student. |
| **POST** | `/admin/students/bulk` | *Placeholder:* Registers students in bulk. |
| **POST** | `/admin/students/custom` | *Placeholder:* Custom student registration. |
| **GET** | `/admin/students` | *Placeholder:* Retrieves all student accounts. |
| **GET** | `/admin/students/:id` | *Placeholder:* Retrieves details of a specific student by ID. |
| **PATCH** | `/admin/students/:id` | *Placeholder:* Updates student information. |
| **PATCH** | `/admin/students/:id/activate` | *Placeholder:* Activates a student account. |
| **PATCH** | `/admin/students/:id/deactivate` | *Placeholder:* Deactivates a student account. |

#### Teacher Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/teachers` | *Placeholder:* Registers a single teacher. |
| **POST** | `/admin/teachers/bulk` | *Placeholder:* Registers teachers in bulk. |
| **POST** | `/admin/teachers/custom` | *Placeholder:* Custom teacher registration. |
| **GET** | `/admin/teachers` | *Placeholder:* Lists all teachers. |
| **GET** | `/admin/teachers/:id` | *Placeholder:* Retrieves details of a specific teacher by ID. |
| **PATCH** | `/admin/teachers/:id` | *Placeholder:* Updates teacher information. |
| **PATCH** | `/admin/teachers/:id/activate` | *Placeholder:* Activates a teacher account. |
| **PATCH** | `/admin/teachers/:id/deactivate` | *Placeholder:* Deactivates a teacher account. |

#### Course Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/courses` | *Placeholder:* Creates a new course. |
| **POST** | `/admin/courses/bulk` | *Placeholder:* Creates courses in bulk. |
| **POST** | `/admin/courses/custom` | *Placeholder:* Custom course creation. |
| **GET** | `/admin/courses` | *Placeholder:* Lists all courses. |
| **GET** | `/admin/courses/:id` | *Placeholder:* Retrieves details of a course by ID. |
| **PATCH** | `/admin/courses/:id` | *Placeholder:* Updates course details. |

#### Department Management (For Universities)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/departments` | *Placeholder:* Creates a new department. |
| **POST** | `/admin/departments/bulk` | *Placeholder:* Bulk imports/creates departments. |
| **POST** | `/admin/departments/custom` | *Placeholder:* Creates departments with custom configurations. |
| **GET** | `/admin/departments` | *Placeholder:* Lists all departments. |
| **GET** | `/admin/departments/:id` | *Placeholder:* Retrieves a specific department by ID. |
| **PATCH** | `/admin/departments/:id` | *Placeholder:* Updates department details. |

#### Class Management (For High Schools)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/classes` | *Placeholder:* Creates a new class room/session. |
| **POST** | `/admin/classes/bulk` | *Placeholder:* Bulk imports/creates classes. |
| **POST** | `/admin/classes/custom` | *Placeholder:* Creates classes with custom configurations. |
| **GET** | `/classes` | *Placeholder:* Lists all classes. |
| **GET** | `/admin/classes/:id` | *Placeholder:* Retrieves details of a specific class by ID. |
| **PATCH** | `/admin/classes/:id` | *Placeholder:* Updates class details. |

---

### 4. Teachers (`/api/v1/teacher`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/teacher/profile` | *Placeholder:* Retrieves the teacher's profile. |
| **PATCH** | `/teacher/profile` | *Placeholder:* Updates the teacher's profile details. |
| **GET** | `/teacher/courses` | *Placeholder:* Lists all courses assigned to this teacher. |
| **GET** | `/teacher/courses/:id` | *Placeholder:* Retrieves details of a specific assigned course. |
| **POST** | `/teacher/grades` | *Placeholder:* Submits a grade for a student. |
| **POST** | `/teacher/grades/bulk` | *Placeholder:* Submits grades in bulk. |
| **GET** | `/teacher/grades` | *Placeholder:* Lists all grades submitted by this teacher. |
| **GET** | `/teacher/grades/:id` | *Placeholder:* Retrieves details of a specific submitted grade. |
| **PATCH** | `/teacher/grades/:id` | *Placeholder:* Updates/corrects a submitted grade. |
| **GET** | `/teacher/flagged-results` | *Placeholder:* Retrieves results flagged by students for the teacher's review. |
| **GET** | `/teacher/flagged-results/:id` | *Placeholder:* Retrieves a specific flagged result details. |
| **PATCH** | `/teacher/flagged-results/:id` | *Placeholder:* Resolves/reviews a flagged result. |

---

### 5. Students (`/api/v1/student`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/student/profile` | *Placeholder:* Retrieves the student's profile. |
| **PATCH** | `/student/profile` | *Placeholder:* Updates student's profile details. |
| **GET** | `/student/dashboard` | *Placeholder:* Retrieves dashboard analytics/overview metrics. |
| **GET** | `/student/results` | *Placeholder:* Retrieves all computed grade results. |
| **GET** | `/student/results/:id` | *Placeholder:* Retrieves detailed breakdown of a specific grade result. |
| **GET** | `/student/results/course/:courseId` | *Placeholder:* Retrieves grade results filtered by course. |
| **POST** | `/student/results/:id/flag` | *Placeholder:* Flags a specific result for teacher review. |
| **GET** | `/student/flags` | *Placeholder:* Retrieves all flags raised by the student. |
| **GET** | `/student/flags/:id` | *Placeholder:* Retrieves details of a specific raised flag. |
