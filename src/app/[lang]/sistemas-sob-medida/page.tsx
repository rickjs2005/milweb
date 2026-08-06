import { serviceRoute } from "@/lib/service-route";

const route = serviceRoute("sistemas-sob-medida");
export const generateMetadata = route.generateMetadata;
export default route.Page;
