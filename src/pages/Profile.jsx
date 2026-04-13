import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const userCookie = localStorage.getItem('user');
    return userCookie ? JSON.parse(userCookie) : { name: '', email: '' };
  });

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwords.oldPassword.trim() || !passwords.newPassword.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.oldPassword === passwords.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from old password' });
      return;
    }

    setIsChanging(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      
      // Reset form
      setPasswords({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Hide form after 2 seconds
      setTimeout(() => {
        setShowPasswordForm(false);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message || 'Failed to change password';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center h-16 gap-4 px-6">
          <button 
            onClick={() => navigate('/cameras')}
            className="flex items-center justify-center rounded-xl h-10 w-10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="tracking-tight text-2xl font-bold leading-tight">Profile</h1>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">account_circle</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">lock</span>
              <span className="text-left">
                <p className="font-semibold">Change Password</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Update your account password</p>
              </span>
            </div>
            <span className={`material-symbols-outlined transition-transform ${showPasswordForm ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Password Change Form */}
          {showPasswordForm && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-700/30 space-y-4">
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  message.type === 'error' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    value={passwords.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    disabled={isChanging}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    disabled={isChanging}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    disabled={isChanging}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      setMessage({ type: '', text: '' });
                    }}
                    disabled={isChanging}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChanging}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isChanging ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">autorenew</span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">check</span>
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Logout Button */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-medium transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
