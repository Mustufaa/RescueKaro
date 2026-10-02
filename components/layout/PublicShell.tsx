import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
export function PublicShell({children}:{children:React.ReactNode}){return <><Navbar/><main className="pt-20">{children}</main><Footer/></>}
