// src/routes/configRoute.js
import ROUTER_PAGE from '../constants/router';
import ForgotPassword from '../pages/login/ForgotPassword';
import Login from '../pages/login/Login';
import OTPVerification from '../pages/login/OTPVerification';
import ResetPassword from '../pages/login/ResetPassword';

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
		path: ROUTER_PAGE.LOGIN,
		exact: true,
		key: 'LOGIN',
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
];

export default CONFIG_ROUTER;
