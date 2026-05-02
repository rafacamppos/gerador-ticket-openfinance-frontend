export interface Category {
  id: number;
  category_name: string;
  sub_category_name: string;
  third_level_category_name: string;
  template_id: number;
  type: number;
}

export interface CategoriesListResponse {
  data: Category[];
  count: number;
}

export interface CategoryDetailResponse {
  data: Category;
}
