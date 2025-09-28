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
import SpinnerDemo from '../pages/SpinnerDemo';
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
		show: false,
		component: SpinnerDemo,
		// icon: <SpinnerOutlined />,
		path: ROUTER_PAGE.SPINNER_DEMO,
		menuName: 'Spinner Demo',
		exact: true,
		key: 'SPINNER_DEMO',
		private: false, // Có thể truy cập mà không cần đăng nhập
	},
];

export default CONFIG_ROUTER;
