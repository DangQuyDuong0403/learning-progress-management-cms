// src/routes/configRoute.js
import ROUTER_PAGE from '../constants/router';
import ChooseLogin from '../pages/login/ChooseLogin.jsx';
import ForgotPassword from '../pages/login/ForgotPassword.jsx';
import Login from '../pages/login/LoginStudent.jsx';
import OTPVerification from '../pages/login/OTPVerification.jsx';
import ResetPassword from '../pages/login/ResetPassword.jsx';
import LoginTeacher from '../pages/login/LoginTeacher.jsx';
import Profile from '../pages/profile/Profile.jsx';
import ProfileStudent from '../pages/profile/ProfileStudent.jsx';
import ChangePassword from '../pages/profile/ChangePassword.jsx';
import Settings from '../pages/settings/Settings.jsx';
import AccountList from '../pages/management/managementAdmin/account/AccountList.jsx';
// import RoleList from '../pages/management/managementAdmin/role/RoleList.jsx';
import LevelList from '../pages/management/ManagementManager/level/LevelList.jsx';
import SyllabusList from '../pages/management/ManagementManager/syllabus/SyllabusList.jsx';
import StudentList from '../pages/management/ManagementManager/Student/StudentList.jsx';
import StudentProfile from '../pages/management/ManagementManager/Student/StudentProfile.jsx';
import StudentLearningProgressOverview from '../pages/management/ManagementManager/Student/StudentLearningProgressOverview.jsx';
import TeacherList from '../pages/management/ManagementManager/teacher/TeacherList.jsx';
import TeacherProfile from '../pages/management/ManagementManager/teacher/TeacherProfile.jsx';
import SpinnerDemo from '../pages/SpinnerDemo.jsx';
//manager
import ClassList from '../pages/management/ManagementManager/Class/ClassList.jsx';
import ClassMenu from '../pages/management/ManagementManager/Class/ClassMenu.jsx';
import ClassDetail from '../pages/management/ManagementManager/Class/ClassDetail.jsx';
import ClassTeachers from '../pages/management/ManagementManager/Class/ClassTeachers.jsx';
import ClassActivities from '../pages/management/ManagementManager/Class/ClassActivities.jsx';
import ClassChapterLesson from '../pages/management/ManagementManager/Class/ClassChapterLesson.jsx';
// Teacher Class Components
import TeacherClassList from '../pages/management/ManagementTeacher/class/ClassList.jsx';
import TeacherClassMenu from '../pages/management/ManagementTeacher/class/ClassMenu.jsx';
import TeacherClassDetail from '../pages/management/ManagementTeacher/class/ClassDetail.jsx';
import TeacherClassDashboard from '../pages/management/ManagementTeacher/class/ClassDashboard.jsx';
import TeacherClassTeachers from '../pages/management/ManagementTeacher/class/ClassTeachers.jsx';
import TeacherClassActivities from '../pages/management/ManagementTeacher/class/ClassActivities.jsx';
import TeacherClassChapterLesson from '../pages/management/ManagementTeacher/class/ClassChapterLesson.jsx';
import DailyChallengeList from '../pages/management/ManagementTeacher/dailyChallenge/DailyChallengeList.jsx';
import CreateGrammarVocabularyChallenge from '../pages/management/ManagementTeacher/dailyChallenge/CreateGrammarVocabularyChallenge.jsx';
import CreateReadingChallenge from '../pages/management/ManagementTeacher/dailyChallenge/CreateReadingChallenge.jsx';
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
	{
		show: false, // không hiện trên menu
		component: Settings,
		// icon: <LogIn size={18} />,
		path: ROUTER_PAGE.SETTINGS,
		exact: true,
		key: 'SETTINGS',
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
	// {
	// 	show: true,
	// 	component: RoleList,
	// 	// icon: <UserOutlined />,
	// 	path: ROUTER_PAGE.ADMIN_ROLES,
	// 	menuName: 'Roles management',
	// 	exact: true,
	// 	key: 'ADMIN_ROLES',
	// 	private: false,
	// 	role: 'admin',
	// },
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
		path: ROUTER_PAGE.MANAGER_LEVELS,
		menuName: 'Levels management',
		exact: true,
		key: 'ADMIN_LEVELS',
		private: true,
		role: 'manager',
	},
	{
		show: true,
		component: TeacherList,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_TEACHERS,
		menuName: 'Teachers management',
		exact: true,
		key: 'MANAGER_TEACHERS',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: TeacherProfile,
		path: ROUTER_PAGE.MANAGER_TEACHER_PROFILE,
		menuName: 'Teacher Profile',
		exact: true,
		key: 'MANAGER_TEACHER_PROFILE',
		private: true,
		// role: 'manager',
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
		show: true,
		component: StudentList,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_STUDENTS,
		menuName: 'Student management',
		exact: true,
		key: 'MANAGER_STUDENTS',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: StudentProfile,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_STUDENT_PROFILE,
		menuName: 'Student Profile',
		exact: true,
		key: 'MANAGER_STUDENT_PROFILE',
		private: true,
		role: 'manager',
	},
	{
		show: false,
		component: StudentLearningProgressOverview,
		// icon: <UserOutlined />,
		path: ROUTER_PAGE.MANAGER_STUDENT_PROGRESS,
		menuName: 'Student Learning Progress Overview',
		exact: true,
		key: 'MANAGER_STUDENT_PROGRESS',
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
	// Daily Challenge Routes for Teacher
	{
		show: true,
		component: DailyChallengeList,
		path: ROUTER_PAGE.TEACHER_DAILY_CHALLENGES,
		menuName: 'Daily Challenge Management',
		exact: true,
		key: 'TEACHER_DAILY_CHALLENGES',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: CreateGrammarVocabularyChallenge,
		path: ROUTER_PAGE.TEACHER_CREATE_GRAMMAR_VOCAB_CHALLENGE,
		menuName: 'Create Grammar & Vocabulary Challenge',
		exact: true,
		key: 'TEACHER_CREATE_GRAMMAR_VOCAB_CHALLENGE',
		private: true,
		role: 'teacher',
	},
	{
		show: false,
		component: CreateReadingChallenge,
		path: ROUTER_PAGE.TEACHER_CREATE_READING_CHALLENGE,
		menuName: 'Create Reading Challenge',
		exact: true,
		key: 'TEACHER_CREATE_READING_CHALLENGE',
		private: true,
		role: 'teacher',
	},
	
];

export default CONFIG_ROUTER;
