import { Link } from "react-router-dom";
import CONFIG_ROUTER from "../routers/configRouter";

export default function Sidebar() {
  return (
    <nav>
      <ul>
        {CONFIG_ROUTER.filter((r) => r.show).map((route) => (
          <li key={route.key}>
            <Link to={route.path} className="flex items-center gap-2">
              {route.icon}
              {route.menuName}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
