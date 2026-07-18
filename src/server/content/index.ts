import {
  getAdjacentPosts as readAdjacentPosts,
  getAllPostSlugs as readAllPostSlugs,
  getAllPosts as readAllPosts,
  getPaginatedPosts as readPaginatedPosts,
  getPostBySlug as readPostBySlug,
  getPostsByTag as readPostsByTag,
  getRelatedPosts as readRelatedPosts,
  getSeriesPosts as readSeriesPosts,
} from '@/lib/posts';
import {
  getAllProjectIds as readAllProjectIds,
  getAllProjects as readAllProjects,
  getFeaturedProjects as readFeaturedProjects,
  getProjectById as readProjectById,
} from '@/lib/projects';
import { getAllLinkCategories as readAllLinkCategories } from '@/lib/links';
import { getAboutContent as readAboutContent } from '@/lib/about';
import {
  getAllTagSlugs as readAllTagSlugs,
  getAllTags as readAllTags,
  getTagNameBySlug as readTagNameBySlug,
} from '@/lib/tags';
import {
  getAllCategories as readAllCategories,
  getAllCategorySlugs as readAllCategorySlugs,
  getPostsByCategory as readPostsByCategory,
  isValidCategory as readIsValidCategory,
} from '@/lib/categories';
import {
  getAllSeries as readAllSeries,
  getAllSeriesSlugs as readAllSeriesSlugs,
  getSeriesBySlug as readSeriesBySlug,
} from '@/lib/series';

/** 读取全部已发布文章摘要；保留底层缓存引用，内容错误原样抛出。 */
export const getAllPosts = readAllPosts;

/** 按 slug 读取文章正文；未找到时返回 null，内容错误原样抛出。 */
export const getPostBySlug = readPostBySlug;

/** 读取全部可路由文章 slug，用于静态参数和站点地图生成。 */
export const getAllPostSlugs = readAllPostSlugs;

/** 按标签名称读取文章摘要；结果沿用仓库既有排序。 */
export const getPostsByTag = readPostsByTag;

/** 按文章 slug 读取前后篇导航；不存在的一侧返回 null。 */
export const getAdjacentPosts = readAdjacentPosts;

/** 按文章 slug 和可选数量上限读取相关文章；未命中时返回空数组。 */
export const getRelatedPosts = readRelatedPosts;

/** 按文章 slug 读取同系列文章；无系列或未命中时返回空数组。 */
export const getSeriesPosts = readSeriesPosts;

/** 按页码和页容量读取文章分页；页码钳制语义由底层查询保持。 */
export const getPaginatedPosts = readPaginatedPosts;

/** 读取全部项目；保留按年份倒序和底层缓存错误语义。 */
export const getAllProjects = readAllProjects;

/** 读取精选项目；没有精选项时返回空数组。 */
export const getFeaturedProjects = readFeaturedProjects;

/** 按项目 id 读取详情；未找到时返回 null。 */
export const getProjectById = readProjectById;

/** 读取全部项目 id，用于动态路由静态参数生成。 */
export const getAllProjectIds = readAllProjectIds;

/** 读取全部收藏链接分类；JSON 缺失或损坏时沿用环境既有错误策略。 */
export const getAllLinkCategories = readAllLinkCategories;

/** 读取关于页原始 MDX；文件不存在时返回 null。 */
export const getAboutContent = readAboutContent;

/** 聚合全部标签及文章数；结果保持既有排序和 slug 规则。 */
export const getAllTags = readAllTags;

/** 按路由 slug 解析原始标签名；未找到时返回 null。 */
export const getTagNameBySlug = readTagNameBySlug;

/** 读取全部标签 slug，用于动态路由静态参数生成。 */
export const getAllTagSlugs = readAllTagSlugs;

/** 聚合全部分类、文章数和覆盖标签；结果保持既有排序。 */
export const getAllCategories = readAllCategories;

/** 按分类路由值读取文章摘要；未命中时返回空数组。 */
export const getPostsByCategory = readPostsByCategory;

/** 检查分类路由值是否存在，并沿用既有解码规则。 */
export const isValidCategory = readIsValidCategory;

/** 读取全部分类 slug，用于动态路由静态参数生成。 */
export const getAllCategorySlugs = readAllCategorySlugs;

/** 聚合全部系列及文章统计；结果保持既有排序。 */
export const getAllSeries = readAllSeries;

/** 按系列路由 slug 读取系列详情；未找到时返回 null。 */
export const getSeriesBySlug = readSeriesBySlug;

/** 读取全部系列 slug，用于动态路由静态参数生成。 */
export const getAllSeriesSlugs = readAllSeriesSlugs;
