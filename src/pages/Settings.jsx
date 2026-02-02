import styles from "@/styles/Settings.module.scss";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@/hooks/useUserData.js";
import { ConfirmModal } from "@/components/modal/ConfirmModal.jsx";
import { BACKGROUND_PRESETS } from "@/constants/backgrounds.js";

const USER_RESET_REQUESTED = "userResetRequested";

export const Settings = () => {
  const { getUserData, updateUserData, deleteUserData, USER_DATA_UPDATED } =
    useUser();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [backgroundId, setBackgroundId] = useState("default");
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    const data = getUserData();
    const id = requestAnimationFrame(() => {
      if (data) {
        setUserData(data);
        setUserName(data.userName ?? "");
        setProfileImage(data.profileImage ?? null);
        setProfileImageUrl(data.profileImage ?? "");
        setBackgroundId(data.background ?? "default");
        setBackgroundImage(data.backgroundImage ?? null);
      }
    });
    const onUpdated = () => {
      const next = getUserData();
      if (next) {
        setUserData(next);
        setUserName(next.userName ?? "");
        setProfileImage(next.profileImage ?? null);
        setProfileImageUrl(next.profileImage ?? "");
        setBackgroundId(next.background ?? "default");
        setBackgroundImage(next.backgroundImage ?? null);
      }
    };
    window.addEventListener(USER_DATA_UPDATED, onUpdated);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(USER_DATA_UPDATED, onUpdated);
    };
  }, [getUserData, USER_DATA_UPDATED]);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setProfileImage(dataUrl);
        setProfileImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const current = getUserData();
    if (!current) return;
    if (!userName.trim()) {
      alert("Please enter a user name.");
      return;
    }
    updateUserData({
      userName: userName.trim(),
      profileImage: profileImage || null,
    });
    setUserData(getUserData());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBackgroundChange = (id) => {
    setBackgroundId(id);
    updateUserData({ background: id, backgroundImage: null });
    setBackgroundImage(null);
  };

  const handleBackgroundImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setBackgroundImage(dataUrl);
      updateUserData({ backgroundImage: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveBackgroundImage = () => {
    setBackgroundImage(null);
    updateUserData({ backgroundImage: null });
  };

  const handleRestartAccount = () => {
    deleteUserData();
    window.dispatchEvent(new CustomEvent(USER_RESET_REQUESTED));
    setConfirmRestart(false);
    navigate("/");
  };

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <div className={styles.profileCard}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatarWrap}>
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarPlaceholder}>?</span>
              )}
            </div>
            <label className={styles.avatarLabel}>
              <span className={styles.avatarButton}>Change photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className={styles.avatarInput}
              />
            </label>
          </div>
          <div className={styles.formBlock}>
            <label className={styles.label} htmlFor="settings-username">
              User name
            </label>
            <input
              id="settings-username"
              type="text"
              className={styles.input}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
            />
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSaveProfile}
            >
              {saved ? "Saved" : "Save profile"}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Background</h2>
        <div className={styles.backgroundCard}>
          <p className={styles.backgroundHint}>
            Choose a preset or upload your own image. Changes apply immediately.
          </p>
          <div className={styles.backgroundUploadRow}>
            <label className={styles.backgroundUploadLabel}>
              <span className={styles.backgroundUploadButton}>
                Upload background
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
                className={styles.backgroundUploadInput}
              />
            </label>
            {backgroundImage && (
              <button
                type="button"
                className={styles.backgroundRemoveButton}
                onClick={handleRemoveBackgroundImage}
              >
                Remove custom
              </button>
            )}
          </div>
          {backgroundImage && (
            <div className={styles.backgroundCustomPreview}>
              <span className={styles.backgroundCustomLabel}>Custom image</span>
              <div
                className={styles.backgroundCustomThumb}
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
            </div>
          )}
          <p className={styles.backgroundPresetsLabel}>Presets</p>
          <div className={styles.backgroundOptions}>
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`${styles.backgroundOption} ${
                  !backgroundImage && backgroundId === preset.id
                    ? styles.backgroundOptionActive
                    : ""
                }`}
                onClick={() => handleBackgroundChange(preset.id)}
                title={preset.label}
                aria-pressed={!backgroundImage && backgroundId === preset.id}
              >
                <span
                  className={styles.backgroundPreview}
                  style={{ background: preset.background }}
                />
                <span className={styles.backgroundLabel}>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.accountCard}>
          <p className={styles.dangerText}>
            Restarting your account will delete all your data (balance, cars,
            warehouses, parts). You will be returned to the login screen. This
            cannot be undone.
          </p>
          <button
            type="button"
            className={styles.restartButton}
            onClick={() => setConfirmRestart(true)}
          >
            Restart account
          </button>
        </div>
      </section>

      <ConfirmModal
        open={confirmRestart}
        onClose={() => setConfirmRestart(false)}
        title="Restart account"
        message="Are you sure? All your data will be deleted and you will need to create a new account. This cannot be undone."
        confirmLabel="Restart"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleRestartAccount}
      />
    </main>
  );
};
