import React from "react";
import { NavLink } from "react-router-dom";

function Sidebar({ menuItems, isOpen }) {
  return (
    <div className="p-2 text-white">
      {menuItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `d-flex align-items-center p-2 mb-2 text-decoration-none text-white rounded ${
                isActive ? "bg-primary" : ""
              }`
            }
          >
            <Icon />
            {isOpen && <span className="ms-3">{item.label}</span>}
          </NavLink>
        );
      })}
    </div>
  );
}

export default Sidebar;
