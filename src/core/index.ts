import { ApplicationManager } from "./application-manager";
let manager: ApplicationManager | null = null;
export const getApplicationManager = () => (manager ??= new ApplicationManager());
