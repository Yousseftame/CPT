import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../../service/firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const db = getFirestore();

interface AuthContextType {
    user: User | null;
    role: "admin" | "superAdmin" | null;
    status: "active" | "inactive" | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    status: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<"admin" | "superAdmin" | null>(null);
    const [status, setStatus] = useState<"active" | "inactive" | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                await currentUser.reload(); // Refresh emailVerified

                const docRef = doc(db, "admins", currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setRole(data.role); // "admin" or "superAdmin"
                    setStatus(data.status); // "active" or "inactive"
                    
                    // Store in localStorage for quick access
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userName', data.name || '');
                    localStorage.setItem('userStatus', data.status || 'active');
                } else {
                    setRole(null);
                    setStatus(null);
                }
            } else {
                setRole(null);
                setStatus(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setRole(null);
        setStatus(null);
        
        // Clear localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userStatus');
    };

    return (
        <AuthContext.Provider value={{ user, role, status, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);