const ROUTER_PAGE = {
	HOME: '/',
	OFFICE_DETAIL: '/office/:id',
	LOGIN_STUDENT: '/login-student',
	FORGOT_PASSWORD_EMAIL: '/forgot-password-email',
	FORGOT_PASSWORD_PHONE: '/forgot-password-phone',
	OTP_VERIFICATION: '/otp-verification',
	RESET_PASSWORD: '/reset-password',
	CHOOSE_LOGIN: '/choose-login',
	LOGIN_TEACHER: '/login-teacher',
	PROFILE : '/profile',
	PROFILE_STUDENT : '/profile-student',
	CHANGE_PASSWORD : '/change-password',
	// Admin Management Routes
	ADMIN_DASHBOARD: '/admin/dashboard',
	ADMIN_ACCOUNTS: '/admin/accounts',
	ADMIN_ROLES: '/admin/roles',
	ADMIN_COURSES: '/admin/courses',
	ADMIN_STUDENTS: '/admin/students',
	ADMIN_TEACHERS: '/admin/teachers',
	ADMIN_REPORTS: '/admin/reports',
	// Spinner Demo
	SPINNER_DEMO: '/spinner-demo',
	// Manager Management Routes
	MANAGER_CLASSES: '/manager/classes',
	//MANAGER_CLASS_DETAIL: '/manager/classes/:id',
	MANAGER_CLASS_STUDENTS: '/manager/classes/student/:id',
	MANAGER_CLASS_TEACHERS: '/manager/classes/teachers/:id',
	MANAGER_CLASS_ACTIVITIES: '/manager/classes/activities/:id',
};

export default ROUTER_PAGE;
