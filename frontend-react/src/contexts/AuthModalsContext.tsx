import React, { createContext, useContext, useState } from "react";

interface AuthModalsContextType {
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openSignupModal: () => void;
  closeSignupModal: () => void;
  switchToSignup: () => void;
  switchToLogin: () => void;
}

const AuthModalsContext = createContext<AuthModalsContextType | undefined>(
  undefined
);

export const AuthModalsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const openLoginModal = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openSignupModal = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  };

  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
  };

  const switchToSignup = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  };

  const switchToLogin = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <AuthModalsContext.Provider
      value={{
        isLoginModalOpen,
        isSignupModalOpen,
        openLoginModal,
        closeLoginModal,
        openSignupModal,
        closeSignupModal,
        switchToSignup,
        switchToLogin,
      }}
    >
      {children}
    </AuthModalsContext.Provider>
  );
};

export const useAuthModals = () => {
  const context = useContext(AuthModalsContext);
  if (context === undefined) {
    throw new Error("useAuthModals must be used within an AuthModalsProvider");
  }
  return context;
};
