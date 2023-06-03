"use client";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import useWindowSize from "hooks/useWindowSize";

export default function Section({ background, children }: {
    background?: JSX.Element;
    children?: JSX.Element | JSX.Element[] | string;
}): JSX.Element {
    const { innerHeight } = useWindowSize();
    const [height, setHeight] = useState(0);
    useEffect(() => {
        const footerHeight = document.querySelector("footer")!.clientHeight;
        setHeight(innerHeight - footerHeight);
    }, [innerHeight]);

    return (
        <Box
            component="section"
            sx={{
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "&:last-of-type": { margin: "-4rem -1rem -1rem", minHeight: `${height}px` },
                "alignItems": "center",
                "display": "flex",
                "flexDirection": "column",
                "justifyContent": "center",
                "margin": "-4rem -1rem 4rem",
                "minHeight": "100dvh",
                "overflow": "hidden",
                "padding": "5rem 1rem 1rem",
                "position": "relative",
                "scrollSnapAlign": "start"
            }}
        >
            <Box zIndex={-1}>{background}</Box>
            <Box sx={{ width: "100%" }}>{children}</Box>
        </Box>
    );
}
