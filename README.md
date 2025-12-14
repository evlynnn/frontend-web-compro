# Frontend Web Monitoring & User Authorization

This project is a **frontend web application** built using **React (Vite)** and **Tailwind CSS**. It provides a modern, responsive user interface for **access monitoring** and **role-based user authorization**, fully integrated with a backend API.

The frontend is responsible for presenting monitoring data, managing authentication flows, and enforcing **role-based UI access**.

---

## Key Features

- User authentication (Login & Register)
- Access monitoring dashboard
- Data visualization (Area Charts, Bar Charts)
- User registration request management
- Password reset request management
- Role-based UI and route protection
- Dark / Light mode support
- Reusable modal popup for success & error feedback

---

## Tech Stack

- React.js (Vite)
- React Router DOM
- Tailwind CSS
- Recharts
- Material UI Icons
- Axios / Fetch API

---

## User Roles & Permissions

| Role | Description | Permissions |
|------|------------|-------------|
| **Administrator** | Standard user with limited access | - Access Monitoring Dashboard<br>- View statistics and access logs |
| **Verificator** | User responsible for authorization and verification | - Access Monitoring Dashboard<br>- Manage Register Requests<br>- Manage Reset Password Requests<br>- Accept / Reject user requests |

---

## Application Routes

| Route | Access Level |
|------|-------------|
| `/` | Login |
| `/register` | Public |
| `/dashboard` | Administrator, Verificator |
| `/user-request` | Verificator only |
| `/reset-password` | Verificator only |

---

## Project Structure

src/
├── assets/ # Static assets (logos, icons)
├── components/ # Reusable UI components
├── pages/ # Application pages
├── services/ # API service layer
├── App.jsx # Application routing
└── main.jsx # Application entry point


---

## ⚙️ Getting Started

### Install Dependencies
```bash
npm install

Run Development Server
npm run dev

```

## Frontend Security Notes

- Client-side input validation is applied on all forms
- Sensitive menus and pages are protected using role-based rendering
- Route access is restricted based on authenticated user role
- No sensitive credentials are stored directly in the frontend
Note: Final authorization decisions are handled by the backend API.

## Notes

- Menu visibility and routing are dynamically adjusted based on user role
- The frontend acts as a presentation and interaction layer
- Backend API serves as the main data source and authorization authority
- The architecture allows easy extension (e.g., real-time monitoring, WebSocket integration)

## License

Made to fulfill the requirements of the Computing Project course