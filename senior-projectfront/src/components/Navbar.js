import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate("/login");
  }

  return (
    <nav className="nav">
      <Link to="/" className="brand">
        <span className="dot" /> CareerKit
      </Link>
      <div className="nav-right">
        {user && <span>{user.full_name}</span>}
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
