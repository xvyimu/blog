import BlogCard from './BlogCard';
import { PostMeta } from '@/types';

export default function BlogList({ posts, columns = 2 }: { posts: PostMeta[]; columns?: 1 | 2 | 3 }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid gap-5 ${gridCols[columns]}`}>
      {posts.length === 0 ? (
        <p className="col-span-full py-12 text-center text-[var(--color-text-muted)]">
          暂无文章
        </p>
      ) : (
        posts.map((post) => <BlogCard key={post.slug} post={post} />)
      )}
    </div>
  );
}