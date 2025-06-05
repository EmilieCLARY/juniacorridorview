import React from "react";

const ConfirmDialog = ({ open, onClose, title, message, confirmText = "Confirmer", cancelText = "Annuler", onConfirm }) => {
  return (
      <>
          {open && (
              <div className="modal" style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
              }}>
                  <div className="modal-content max-w-lg" style={{
                      padding: '2rem',
                      borderRadius: '1rem',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      width: "fit-content",
                      maxWidth: '40vw'
                  }}>
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-title text-junia-purple">
                              {title}
                          </h2>
                      </div>
                      <div className="p-3 border border-red-200 rounded-lg text-red-700">
                          {message}
                      </div>
                      <div className="flex justify-between mt-4">
                          <button
                              className="px-6 py-3 bg-junia-orange rounded-full font-title text-lg shadow-lg"
                              onClick={() => { onClose(); }}
                          >
                                {cancelText}
                          </button>
                          <button
                              className="bg-junia-purple px-6 py-3 text-white rounded-full font-title text-lg shadow-lg"
                              onClick={() => {
                                    onConfirm();
                                    onClose();
                              }}
                          >
                                {confirmText}
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </>
  );
}

export default ConfirmDialog;