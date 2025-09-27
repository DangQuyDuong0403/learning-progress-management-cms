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
		path: ROUTER_PAGE.FORGOT_PASSWORD,
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
	
];

export default CONFIG_ROUTER;
