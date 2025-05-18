import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import ErrorPage from "../pages/ErrorPage";
import Home from "../pages/home";
import FormLogin from "../components/FormLogin";
import RegisterLogin from "../components/FormRegister";
import FormCreateEvent from "../components/FormCreateEvent";
import CardDetail from "../pages/CardDetail";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import EditProfile from "../pages/EditProfile";
import EventUser from "../components/EventUser";
import Dashboard from "../pages/Dashboard";
import PublicProfile from "../pages/PublicProfile";
import FavoritePhotos from "../pages/FavoritePhotos";
;

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Home/>,
            },
            {
                path: "register",
                element: <RegisterLogin/>,
            },
            {
                path: "login",
                element: <FormLogin/>,
            },
            {
                path: "create-event",
                element: 
                <ProtectedRoute>
                    <FormCreateEvent/>,
                </ProtectedRoute>
            },
            {
                path: "event/:id",
                element: 
                <ProtectedRoute>
                    <CardDetail/>,
                </ProtectedRoute>
            },
            {
                path: "profile",
                element: 
                <ProtectedRoute>
                    <Profile/>,
                </ProtectedRoute>,
                children: [
                    {
                        path: "edit-profile",
                        element:
                            <EditProfile/>,
                    },
                    {
                        path: "my-events",
                        element:
                            <EventUser/>,
                    },
                ]
            },
            {
                path: "dashboard",
                element: 
                <ProtectedRoute>
                    <Dashboard/>,
                </ProtectedRoute>
            },
            {
                path: "profile/:id",
                element:
                <ProtectedRoute>
                    <PublicProfile/>,
                </ProtectedRoute>,
            },
            {
                path: "favorite-photos",
                element:
                <ProtectedRoute>
                    <FavoritePhotos/>,
                </ProtectedRoute>,
            }
            
        ],
    }
]);