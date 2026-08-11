const AdminProfile = ({ profileForm, setProfileForm, profileMsg, onSaveProfile }) => {
  return (
    <div className="tab-panel">
      <form className="admin-profile-form" onSubmit={onSaveProfile}>
        <h3>Security & Account Settings</h3>
        {profileMsg && <div className="profile-msg-banner">{profileMsg}</div>}

        <div className="form-row-grid">
          <div className="form-group">
            <label htmlFor="adminName">Display Name</label>
            <input
              id="adminName"
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="adminEmail">Email Address</label>
            <input id="adminEmail" type="email" value={profileForm.email} readOnly />
          </div>
        </div>

        <div className="form-row-grid">
          <div className="form-group">
            <label htmlFor="currPass">Current Password</label>
            <input
              id="currPass"
              type="password"
              value={profileForm.currentPassword}
              onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPass">New Password</label>
            <input
              id="newPass"
              type="password"
              value={profileForm.newPassword}
              onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>
        </div>

        <button type="submit" className="profile-save-btn">Update Profile</button>
      </form>
    </div>
  )
}

export default AdminProfile
