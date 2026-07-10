import { serviceRoute } from "@/lib/service-route";

const route = serviceRoute("catalogo-whatsapp");
export const generateMetadata = route.generateMetadata;
export default route.Page;
