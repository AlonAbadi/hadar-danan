import { getRevenueStats } from '@/lib/admin/queries';
import ProductsClient from './client';

export default async function ProductsPage() {
  const revenue = await getRevenueStats('30d');
  return <ProductsClient revenue={revenue} />;
}
