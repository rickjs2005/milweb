import { serviceRoute } from "@/lib/service-route";

const route = serviceRoute("loja-virtual");
export const generateMetadata = route.generateMetadata;
export default route.Page;
