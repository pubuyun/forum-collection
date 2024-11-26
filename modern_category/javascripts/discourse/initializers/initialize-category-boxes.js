import { apiInitializer } from "discourse/lib/api";
import CustomCategoryBoxes from "../components/custom-category-boxes";
import CustomCategoryButtons from "../components/category-buttons";

export default apiInitializer("1.14.0", (api) => {
  api.renderInOutlet("above-discovery-categories", CustomCategoryButtons);
  api.renderInOutlet("above-discovery-categories", CustomCategoryBoxes);
});
