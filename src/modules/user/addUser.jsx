import { useState } from "react";
import { Modal } from "@/components/modal/modal.jsx";
import styles from "@/styles/app.module.scss";
import { useUser } from "@/hooks/useUserData.js";
export const AddUser = ({ setValidUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setProfileImage(dataUrl);

        setProfileImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleUserNameChange = (e) => {
    setUserName(e.target.value);
  };
  const { addUserData } = useUser();

  const handleAddUserData = () => {
    if (userName.trim() === "") {
      alert("Please enter a valid user name");
      return;
    }
    addUserData({
      userName: userName.trim(),
      profileImage: profileImage || null,
    });
    setIsModalOpen(false);
    setValidUser(true);
  };
  return (
    <>
      <Modal
        open={isModalOpen}
        disableCloseButton={true}
        onClose={() => {
          setIsModalOpen(false);
        }}
        title="Login"
      >
        <div className={styles.addUserModal}>
          {profileImage && (
            <img
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
              src={profileImageUrl}
              alt="Profile"
            />
          )}
          <h2>Welcome to the app.</h2>
          <p>Please Enter Your UserName and Get Started.</p>
          <input
            type="text"
            placeholder="Enter Your UserName"
            value={userName}
            onChange={handleUserNameChange}
          />
          <span>
            <label htmlFor="profilePicture">Upload Your Profile Picture</label>
            <input
              style={{ marginTop: "12px" }}
              type="file"
              id="profilePicture"
              onChange={handleProfileImageChange}
              accept="image/*"
            />
          </span>
          <button onClick={handleAddUserData}>Save & Proceed</button>
        </div>
      </Modal>
    </>
  );
};
