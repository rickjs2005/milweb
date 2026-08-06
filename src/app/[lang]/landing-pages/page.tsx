import { serviceRoute } from "@/lib/service-route";

const route = serviceRoute("landing-pages");
export const generateMetadata = route.generateMetadata;
export default route.Page;
