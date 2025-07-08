import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { createUser, getAllUsers, resetPassword, deleteUser } from "../api/AxiosAdminUser";
import { FaTrash, FaPen, FaPlus } from "react-icons/fa";
import ConfirmDialog from "./dialogs/ConfirmDialog";
import { toast } from 'sonner';
import '../style/AdminUser.css'; // Assurez-vous que le CSS est importé

const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const specials = "!@#$%^&*()_+-=~";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += specials.charAt(Math.floor(Math.random() * specials.length));
  pwd += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  pwd += String.fromCharCode(97 + Math.floor(Math.random() * 26));
  pwd += Math.floor(Math.random() * 10);
  return pwd;
};

const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [resetLinks, setResetLinks] = useState({}); // { [uid]: link }
  const [resetModal, setResetModal] = useState({ open: false, email: "", link: "" });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, email: "", uid: "" });
  const [search, setSearch] = useState(""); // Ajout de l'état pour la recherche

  useEffect(() => {
    // Fetch users on mount
    getAllUsers()
      .then((users) => {
        setUsers(users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setResetLink("");
    try {
      const res = await createUser(newEmail, newPassword);
      setMessage("Administrateur créé !");
      setResetLink(res.resetLink);
      // Ne vide pas les champs ici, attend la fermeture de la modal
      setLoading(true);
      const users = await getAllUsers();
      setUsers(users);
      setLoading(false);
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
        err?.message ||
        "Erreur lors de la création."
      );
    }
  };

  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setNewPassword(pwd);
    navigator.clipboard.writeText(pwd).then(() => setCopied(true));
    setTimeout(() => setCopied(false), 1500);
  };

  const handleResetPassword = async (email, uid) => {
    setMessage("");
    try {
      const res = await resetPassword(email);
      setResetLinks(prev => ({ ...prev, [uid]: res.resetLink }));
      setResetModal({ open: true, email, link: res.resetLink });
      setMessage(""); // Optionally clear message here
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
        err?.message ||
        "Erreur lors de la génération du lien de réinitialisation."
      );
    }
  };

  const handleDeleteUser = async (uid, email) => {
    setConfirmDelete({ open: true, email, uid });
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteUser(confirmDelete.uid);
      setUsers(users => users.filter(u => u.uid !== confirmDelete.uid));
      setConfirmDelete({ open: false, email: "", uid: "" });
      setResetModal({ open: false, email: "", link: "" });
      toast.success("Administrateur supprimé avec succès !");
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
        err?.message ||
        "Erreur lors de la suppression de l'administrateur."
      );
      setConfirmDelete({ open: false, email: "", uid: "" });
    }
  };

  return (
    <div className="admin-user-page">
      <div className="mx-auto p-3">
        <div className="max-w-7xl mx-auto py-10 px-6 ">
          <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-junia-orange m-4 mb-3">
            <div className="flex flex-col lg:flex-row gap-8">

              <div className="flex flex-row items-start gap-8">
                <div className="flex flex-col flex-grow">
                  <div className="flex flex-row justify-between items-center mb-8 ml-4 mt-2">
                    <div className="text-3xl font-title text-junia-purple font-bold">Liste des administrateurs</div>
                    <button
                      className="bg-junia-orange hover:bg-junia-purple text-white p-2 rounded-full font-title text-lg shadow-lg hover:shadow-xl transform mr-4 mt-2 cursor-pointer flex flex-row items-center gap-2"
                      onClick={() => setShowModal(true)}
                    >
                      <FaPlus/> Nouvel administrateur
                    </button>
                  </div>
                  {/* Barre de recherche */}
                  <div className="mb-6 ml-4 mr-4 pt-2">
                    <input
                      type="text"
                      placeholder="Rechercher un administrateur par email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-junia-orange rounded-full font-texts focus:outline-none focus:border-junia-purple transition-colors text-junia-orange placeholder-junia-orange"
                    />
                  </div>
                  {message && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center font-semibold">
                      {message}
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-xl m-4">
                    {loading ? (
                      <div className="text-center py-12 text-xl text-junia-purple font-title">Chargement...</div>
                    ) : (
                      <table className="w-full bg-white rounded-xl overflow-hidden">
                        <thead className="p-4 rounded-t-xl">
                          <tr className="bg-junia-purple text-white">
                            <th className="px-4 py-4 font-title text-lg text-center">Email</th>
                            <th className="px-4 py-4 font-title text-lg text-center">UID</th>
                            <th className="py-4 font-title text-lg text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="rounded-b-xl">
                          {[...users]
                            .filter(user => user.email.toLowerCase().includes(search.toLowerCase()))
                            .sort((a, b) => a.email.localeCompare(b.email))
                            .map((user, index) => (
                              <tr key={user.uid} className={`border-b border-gray-200 hover:bg-junia-lavender transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="px-4 py-4 font-texts text-gray-800">{user.email}</td>
                                <td className="px-4 py-4 font-mono text-xs text-gray-600 break-all text-center">{user.uid}</td>
                                <td className="px-6 py-4 flex flex-col sm:flex-row gap-2 items-center">
                                  <button
                                    className="bg-junia-orange hover:bg-junia-purple transition-colors text-white px-4 py-2 rounded-full font-title text-sm mr-0 sm:mr-2 flex items-center gap-2 group cursor-pointer"
                                    onClick={() => handleResetPassword(user.email, user.uid)}
                                    style={{ width: 'fit-content' }}
                                  >
                                    <FaPen className="text-base" />
                                    Réinitialiser le mot de passe
                                  </button>
                                  <button
                                    className="bg-junia-purple hover:bg-red-800 transition-colors text-white px-4 py-2 rounded-full font-title text-sm flex items-center gap-2 group cursor-pointer"
                                    onClick={() => handleDeleteUser(user.uid, user.email)}
                                    style={{ width: 'fit-content' }}
                                  >
                                    <FaTrash className="text-base" />
                                    Supprimer le compte
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showModal && (
          <div className="modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content max-w-lg" style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '90%',
              maxWidth: '32rem'
            }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-title text-junia-purple">Créer un administrateur</h2>
                <button
                  className="text-gray-400 hover:text-junia-purple text-3xl leading-none cursor-pointer transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setMessage("");
                    setResetLink("");
                    setNewEmail("");
                    setNewPassword("");
                  }}
                  aria-label="Fermer"
                  style={{ background: 'none', border: 'none' }}
                >
                  &times;
                </button>
              </div>
              {/* Affiche le message dans la modal */}
              {message && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center font-semibold">
                  {message}
                </div>
              )}
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="block text-sm font-title text-junia-purple mb-2">Email de l'administrateur</label>
                  <input
                    type="email"
                    required
                    placeholder="Entrez l'email du nouvel administrateur"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-junia-purple rounded-lg font-texts focus:outline-none focus:border-junia-orange transition-colors ${!!message ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!!message}
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-title text-junia-purple mb-2">Mot de passe temporaire</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Générez ou saisissez un mot de passe"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={`flex-1 px-4 py-3 border-2 border-junia-purple rounded-lg font-texts focus:outline-none focus:border-junia-orange transition-colors ${!!message ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!!message}
                    />
                    <button
                      type="button"
                      className={`px-4 py-3 bg-junia-purple rounded-lg font-title whitespace-nowrap transition-colors ${!!message ? 'bg-gray-400 cursor-not-allowed' : 'bg-junia-orange hover:bg-junia-purple text-white'}`}
                      onClick={!!message ? undefined : handleGeneratePassword}
                      title="Générer un mot de passe sécurisé"
                    >
                      Générer
                    </button>
                  </div>
                  {copied && (
                    <div className="mt-2 text-green-600 text-sm font-semibold flex items-center">
                      ✓ Mot de passe copié dans le presse-papiers !
                    </div>
                  )}
                </div>
                {resetLink && (
                  <div className="form-group">
                    <label className="block text-sm font-title text-junia-purple mb-2">Lien de création du mot de passe</label>
                    <div className="p-3 bg-blue-50 border border-junia-orange rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">
                        Envoyez ce lien à l'administrateur pour qu'il puisse définir son mot de passe :
                        <a
                          href={resetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm break-all hover:text-blue-800 transition-colors pl-2"
                        >
                          Lien
                        </a>
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowModal(false);
                      setMessage("");
                      setResetLink("");
                      setNewEmail("");
                      setNewPassword("");
                    }}
                    className="bg-junia-orange flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-title text-lg hover:bg-gray-50 transition-colors"
                  >
                    {message ? "Fermer la modal" : "Annuler"}
                  </button>
                  {!message && (
                    <button 
                      type="submit" 
                      className="flex-1 bg-junia-purple hover:bg-junia-orange transition-colors text-white px-6 py-3 rounded-full font-title text-lg shadow-lg"
                    >
                      Créer l'administrateur
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
        {resetModal.open && (
          <div className="modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content max-w-lg" style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '90%',
              maxWidth: '32rem'
            }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-title text-junia-purple">
                  Lien de réinitialisation du mot de passe pour {resetModal.email}
                </h2>
                <button
                  className="text-gray-400 hover:text-junia-purple text-3xl leading-none cursor-pointer transition-colors"
                  onClick={() => setResetModal({ open: false, email: "", link: "" })}
                  aria-label="Fermer"
                  style={{ background: 'none', border: 'none' }}
                >
                  &times;
                </button>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  Envoyez ce lien à l'administrateur pour qu'il puisse définir son mot de passe :
                
                <a
                  href={resetModal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm break-all hover:text-blue-800 transition-colors pl-2"
                >
                  Lien
                </a>
                </p>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  className="px-6 py-3 bg-junia-purple hover:bg-junia-orange transition-colors text-white rounded-full font-title text-lg shadow-lg"
                  onClick={() => setResetModal({ open: false, email: "", link: "" })}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
        <ConfirmDialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, email: "", uid: "" })} title={"Confirmer la suppression"} message={"Êtes-vous sûr de vouloir supprimer " + confirmDelete.email + " ? Cette action est irréversible."} confirmText={"Supprimer définitivement"} onConfirm={confirmDeleteUser} />
      </div>
    </div>
  );
};

export default AdminUser;
