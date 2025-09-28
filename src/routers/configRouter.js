// src/routes/configRoute.js
import ROUTER_PAGE from '../constants/router';
import ChooseLogin from '../pages/login/ChooseLogin';
import ForgotPassword from '../pages/login/ForgotPassword';
import Login from '../pages/login/LoginStudent';
import OTPVerification from '../pages/login/OTPVerification';
import ResetPassword from '../pages/login/ResetPassword';
import LoginTeacher from '../pages/login/LoginTeacher';
import Profile from '../pages/profile/Profile';
import ProfileStudent from '../pages/profile/ProfileStudent';
import ChangePassword from '../pages/profile/ChangePassword';
import AccountList from '../pages/management/managementAdmin/account/AccountList';
import RoleList from '../pages/management/managementAdmin/role/RoleList';
import LevelList from '../pages/management/ManagementManager/level/LevelList';
import SyllabusList from '../pages/management/ManagementManager/syllabus/SyllabusList';
import SpinnerDemo from '../pages/SpinnerDemo';
import ClassList from '../pages/management/ManagementManager/Class/ClassList';
import ClassMenu from '../pages/management/ManagementManager/Class/ClassMenu';
import ClassDetail from '../pages/management/ManagementManager/Class/ClassDetail';
import ClassTeachers from '../pages/management/ManagementManager/Class/ClassTeachers';
import ClassActivities from '../pages/management/ManagementManager/Class/ClassActivities';
import ClassChapterLesson from '../pages/management/ManagementManager/Class/ClassChapterLesson';
// Teacher Class Components
import TeacherClassList from '../pages/management/ManagementTeacher/class/ClassList';
import TeacherClassMenu from '../pages/management/ManagementTeacher/class/ClassMenu';
import TeacherClassDetail from '../pages/management/ManagementTeacher/class/ClassDetail';
import TeacherClassDashboard from '../pages/management/ManagementTeacher/class/ClassDashboard';
import TeacherClassTeachers from '../pages/management/ManagementTeacher/class/ClassTeachers';
import TeacherClassActivities from '../pages/management/ManagementTeacher/class/ClassActivities';
import TeacherClassChapterLesson from '../pages/management/ManagementTeacher/class/ClassChapterLesson';
// import AdminDashboard from '../pages/management/managementAdmin/AdminDashboard';
  
const CONFIG_ROUTER = [
	//   {
	//     show: true,
	//     component: <Home />,
	//     icon: <HomeIcon size={18} />,
	//     path: ROUTER_PAGE.HOME,
	//     menuName: "Trang chủ",
	//     exact: true,
	//     key: "HOME",
	//     private: true, // chi dang nhap moi duoc vao
	//   },
	{
		show: false, // không hiện trên menu
		component: Login,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.LOGIN_STUDENT,
		exact: true,
		key: 'LOGIN_STUDENT',
	},
	{
		show: false, // không hiện trên menu
		component: ForgotPassword,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.FORGOT_PASSWORD_EMAIL,
		exact: true,
		key: 'FORGOT_PASSWORD',
	},
	{
		show: false, // không hiện trên menu
		component: ForgotPassword,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.FORGOT_PASSWORD_PHONE,
		exact: true,
		key: 'FORGOT_PASSWORD',
	},
	{
		show: false, // không hiện trên menu
		component: OTPVerification,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.OTP_VERIFICATION,
		exact: true,
		key: 'OTP_VERIFICATION',
	},
	{
		show: false, // không hiện trên menu
		component: ResetPassword,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.RESET_PASSWORD,
		exact: true,
		key: 'RESET_PASSWORD',
	},
	{
		show: false, // không hiện trên menu
		component: ChooseLogin,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.CHOOSE_LOGIN,
		exact: true,
		key: 'CHOOSE_LOGIN',
	},
	{
		show: false, // không hiện trên menu
		component: LoginTeacher,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.LOGIN_TEACHER,
		exact: true,
		key: 'LOGIN_TEACHER',
	},
	{
		show: false, // không hiện trên menu
		component: Profile,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.PROFILE,
		exact: true,
		key: 'PROFILE',
	},
	{
		show: false, // không hiện trên menu
		component: ProfileStudent,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.PROFILE_STUDENT,
		exact: true,
		key: 'PROFILE_STUDENT',
	},
	{
		show: false, // không hiện trên menu
		component: ChangePassword,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.CHANGE_PASSWORD,
		exact: true,
		key: 'CHANGE_PASSWORD',
	},
	
	// Admin Management Routes
	// {
	// 	show: true,
	// 	component: AdminDashboard,
	// 	// icon: <DashboardOutlined />,
	// 	path: ROUTER_PAGE.ADMIN_DASHBOARD,
	// 	menuName: 'Dashboard',
	// 	exact: true,
	// 	key: 'ADMIN_DASHBOARD',
	// 	private: true,
	// 	role: 'admin',
	// },
	{
		show: true,
		component: AccountList,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.ADMIN_ACCOUNTS,
		menuName: 'Accounts management',
		exact: true,
		key: 'ADMIN_ACCOUNTS',
		private: true,
		role: 'admin',
	},
	{
		show: true,
		component: RoleList,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.ADMIN_ROLES,
		menuName: 'Roles management',
		exact: true,
		key: 'ADMIN_ROLES',
		private: true,
		role: 'admin',
	},
	{
		show: true,
		component: ClassList,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_CLASSES,
		menuName: 'classes management',
		exact: true,
		key: 'MANAGER_CLASSES',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: ClassMenu,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_CLASS_MENU,
		menuName: 'class menu',
		exact: true,
		key: 'MANAGER_CLASS_MENU',
		private: true,
		role: 'manager',
	},
	// {
	// 	show: false,
	// 	component: ClassDetail,
	// 	// icon: <UserOutlined />,
	// 	path: ROUTER_PAGE.MANAGER_CLASS_DETAIL,
	// 	menuName: 'class detail',
	// 	exact: true,
	// 	key: 'MANAGER_CLASS_DETAIL',
	// 	private: true,
	// 	role: 'admin',
	// },
	{
		show: false,
		component: ClassDetail,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_CLASS_STUDENTS,
		menuName: 'class students',
		exact: true,
		key: 'MANAGER_CLASS_STUDENTS',
		private: true,
		role: 'manager',
	},
	{
		show: true,
		component: LevelList,
		// icon: <BookOutlined />,
		path: ROUTER_PAGE.ADMIN_LEVELS,
		menuName: 'Levels management',
		exact: true,
		key: 'ADMIN_LEVELS',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: ClassTeachers,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_CLASS_TEACHERS,
		menuName: 'class teachers',
		exact: true,
		key: 'MANAGER_CLASS_TEACHERS',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: ClassActivities,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_CLASS_ACTIVITIES,
		menuName: 'class activities',
		exact: true,
		key: 'MANAGER_CLASS_ACTIVITIES',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: ClassChapterLesson,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_CLASS_CHAPTERS_LESSONS,
		menuName: 'class chapters lessons',
		exact: true,
		key: 'MANAGER_CLASS_CHAPTERS_LESSONS',
		private: true,
		role: 'manager',
	},
	
	{
		show: true,
		component: SyllabusList,
		// icon: <FileTextOutlined />,
		path: ROUTER_PAGE.MANAGER_SYLLABUSES,
		menuName: 'Syllabus management',
		exact: true,
		key: 'MANAGER_SYLLABUSES',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: SpinnerDemo,
		// icon: <SpinnerOutlined />,
		path: ROUTER_PAGE.SPINNER_DEMO,
		menuName: 'Spinner Demo',
		exact: true,
		key: 'SPINNER_DEMO',
		private: false, // Có thể truy cập mà không cần đăng nhập
	},
	
	// Teacher Management Routes
	{
		show: true,
		component: TeacherClassList,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASSES,
		menuName: 'My Classes',
		exact: true,
		key: 'TEACHER_CLASSES',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: TeacherClassMenu,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASS_MENU,
		menuName: 'class menu',
		exact: true,
		key: 'TEACHER_CLASS_MENU',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: TeacherClassDashboard,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASS_DASHBOARD,
		menuName: 'class dashboard',
		exact: true,
		key: 'TEACHER_CLASS_DASHBOARD',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: TeacherClassDetail,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASS_STUDENTS,
		menuName: 'class students',
		exact: true,
		key: 'TEACHER_CLASS_STUDENTS',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: TeacherClassTeachers,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASS_TEACHERS,
		menuName: 'class teachers',
		exact: true,
		key: 'TEACHER_CLASS_TEACHERS',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: TeacherClassActivities,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASS_ACTIVITIES,
		menuName: 'class activities',
		exact: true,
		key: 'TEACHER_CLASS_ACTIVITIES',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: TeacherClassChapterLesson,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.TEACHER_CLASS_CHAPTERS_LESSONS,
		menuName: 'class chapters lessons',
		exact: true,
		key: 'TEACHER_CLASS_CHAPTERS_LESSONS',
		private: true,
		role: 'teacher',
	},
	
];

export default CONFIG_ROUTER;
