import { CameraControls, Environment } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";

export const Scenario = () => {
  const cameraControls = useRef();
  useEffect(() => {
    cameraControls.current.setLookAt(0, 1.5, 7, 0, 1.0, 0, true);
  }, []);
  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Avatar />
    </>
  );
};
