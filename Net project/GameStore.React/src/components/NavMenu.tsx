import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const NavMenu: React.FC = () => {
    return (
        <nav className="navbar navbar-expand game-navbar">
            <div className="container">
                <NavLink className="navbar-brand" to="/">
                    <span className="brand-mark"><i className="bi bi-controller"></i></span>
                    <span>
                        GameStore
                        <span className="brand-subtitle d-none d-sm-block">Your game library</span>
                    </span>
                </NavLink>

                <div className="ms-auto d-flex align-items-center gap-2">
                    <span className="nav-pill d-none d-md-inline-flex">
                        <i className="bi bi-lightning-charge-fill"></i>
                        ASP.NET + React
                    </span>
                    <Link className="primary-action" to="/editgame">
                        <i className="bi bi-plus-lg"></i>
                        <span className="d-none d-sm-inline">Add Game</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default NavMenu;
