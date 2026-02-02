import styles from "@/components/sidebar/sidebar.module.scss";
import { useUser } from "@/hooks/useUserData.js";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import iconMarketplace from "@/assets/icons/market.svg";
import iconWarehouse from "@/assets/icons/warehouse.svg";
import iconTradeIns from "@/assets/icons/trade.svg";
import iconSettings from "@/assets/icons/settings.svg";
import iconGeneral from "@/assets/icons/general.svg";
export const Sidebar = ({ onResetUser }) => {
  const { getUserData, deleteUserData, USER_DATA_UPDATED } = useUser();
  const [userDataProfile, setUserDataProfile] = useState(null);
  const location = useLocation();
  const navigationItems = [
    {
      title: "General",
      route: "/",
    },
    {
      title: "Marketplace",
      route: "/marketplace",
    },
    {
      title: "Warehouse",
      route: "/warehouse",
    },
    {
      title: "TradeIns",
      route: "/tradeins",
    },
    {
      title: "Settings",
      route: "/settings",
    },
  ];

  const handleDeleteUserData = () => {
    deleteUserData();
    onResetUser();
  };

  useEffect(() => {
    const userData = getUserData();
    const id = requestAnimationFrame(() => {
      if (userData) setUserDataProfile(userData);
    });
    const onUserDataUpdated = () => {
      const next = getUserData();
      if (next) setUserDataProfile(next);
    };
    window.addEventListener(USER_DATA_UPDATED, onUserDataUpdated);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(USER_DATA_UPDATED, onUserDataUpdated);
    };
  }, [getUserData, USER_DATA_UPDATED]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <div className={styles.userStats}>
          <div className={styles.userAvatar}>
            {userDataProfile?.profileImage && (
              <img alt="profile" src={userDataProfile?.profileImage} />
            )}
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>
              {userDataProfile?.userName ?? "—"}
            </p>
            <p className={styles.userBalanceLabel}>Balance</p>
            <p className={styles.userBalance}>
              {userDataProfile?.balance != null
                ? `$${Number(userDataProfile.balance).toLocaleString()}`
                : "—"}
            </p>
          </div>
        </div>
        {/* Mobile: profile + balance in bottom bar */}
        <div className={styles.userStatsMobile}>
          <div className={styles.userAvatarMobile}>
            {userDataProfile?.profileImage && (
              <img alt="" src={userDataProfile.profileImage} />
            )}
          </div>
          <div className={styles.userDetailsMobile}>
            <p className={styles.userNameMobile}>
              {userDataProfile?.userName ?? "—"}
            </p>
            <p className={styles.userBalanceMobile}>
              {userDataProfile?.balance != null
                ? `$${Number(userDataProfile.balance).toLocaleString()}`
                : "—"}
            </p>
          </div>
        </div>
        <nav className={styles.navigation} aria-label="Main">
          <ul className={styles.navList}>
            {navigationItems.map((item) => {
              let iconSrc;
              let iconAlt;
              switch (item.title) {
                case "General":
                  iconSrc = iconGeneral;
                  iconAlt = "General";
                  break;
                case "Marketplace":
                  iconSrc = iconMarketplace;
                  iconAlt = "Marketplace";
                  break;
                case "Warehouse":
                  iconSrc = iconWarehouse;
                  iconAlt = "Warehouse";
                  break;
                case "TradeIns":
                  iconSrc = iconTradeIns;
                  iconAlt = "TradeIns";
                  break;
                case "Settings":
                  iconSrc = iconSettings;
                  iconAlt = "Settings";
                  break;
                default:
                  iconSrc = null;
                  iconAlt = "";
              }
              const isActive = location.pathname === item.route;
              return (
                <li
                  key={item.title}
                  className={`${styles.navItem} ${
                    isActive ? styles.active : ""
                  }`}
                >
                  <Link to={item.route} className={styles.linkContainer}>
                    {iconSrc && <img src={iconSrc} alt={iconAlt} />}
                    <span>
                      {item.title}{" "}
                      {item.route === "/warehouse" &&
                        `(${userDataProfile?.warehouseIds?.length})`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDeleteUserData}
            >
              Delete Account
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};
