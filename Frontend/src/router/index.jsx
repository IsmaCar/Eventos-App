import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import ErrorPage from "../pages/ErrorPage";
import Home from "../pages/home";
import FormLogin from "../components/FormLogin";
import RegisterLogin from "../components/FormRegister";
import FormCreateEvent from "../components/FormCreateEvent";

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
                element: <FormCreateEvent/>,
            }
        ],
    }
]);