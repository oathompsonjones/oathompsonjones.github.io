import { Typography } from "@mui/material";

/**
 * A wrapper to build the page and error.
 *
 * @returns {JSX.Element} A page wrapper.
 */
export default function Layout({ children }: { readonly children: React.ReactNode; }): JSX.Element {
    return (
        <>
            <Typography variant="h2">Portfolio</Typography>
            {children}
        </>
    );
}
