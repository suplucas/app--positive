import { describe, it, expectTypeOf } from 'vitest';
import type { AppNotification, NotificationsResponse } from './types';
import type { Review, ReviewAuthor, ReviewRestaurant } from '../common/types';

// Shape dos tipos do feed v1 (spec 6.1/6.5). Asserts de compile-time:
// o RED/GREEN desta suíte roda via `npm run typecheck`.
describe('tipos do feed v1', () => {
  it('Review ganha title/commentCount/author/restaurant', () => {
    expectTypeOf<Review['title']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<Review['commentCount']>().toEqualTypeOf<
      number | null | undefined
    >();
    expectTypeOf<Review['author']>().toEqualTypeOf<
      ReviewAuthor | null | undefined
    >();
    expectTypeOf<Review['restaurant']>().toEqualTypeOf<
      ReviewRestaurant | null | undefined
    >();
    expectTypeOf<ReviewAuthor>().toEqualTypeOf<{
      id: string;
      name: string;
      handle: string | null;
      photoUrl: string | null;
    }>();
    expectTypeOf<ReviewRestaurant>().toEqualTypeOf<{
      id: string;
      name: string;
      location: string | null;
    }>();
  });

  it('AppNotification do painel (spec 6.5)', () => {
    expectTypeOf<AppNotification['id']>().toEqualTypeOf<string | number>();
    expectTypeOf<AppNotification['ids']>().toEqualTypeOf<(string | number)[]>();
    expectTypeOf<AppNotification['type']>().toEqualTypeOf<string>();
    expectTypeOf<AppNotification['actorId']>().toEqualTypeOf<string | null>();
    expectTypeOf<AppNotification['actors']>().toEqualTypeOf<ReviewAuthor[]>();
    expectTypeOf<AppNotification['count']>().toEqualTypeOf<number>();
    expectTypeOf<AppNotification['reviewId']>().toEqualTypeOf<
      string | number | null
    >();
    expectTypeOf<AppNotification['review']>().toEqualTypeOf<
      | {
          id: string | number;
          rating: number | null;
          photoUrl: string | null;
        }
      | null
      | undefined
    >();
    expectTypeOf<AppNotification['restaurantId']>().toEqualTypeOf<
      string | null
    >();
    expectTypeOf<AppNotification['restaurant']>().toEqualTypeOf<
      ReviewRestaurant | null | undefined
    >();
    expectTypeOf<AppNotification['previewText']>().toEqualTypeOf<
      string | null
    >();
    expectTypeOf<AppNotification['readAt']>().toEqualTypeOf<string | null>();
    expectTypeOf<AppNotification['createdAt']>().toEqualTypeOf<string>();
    expectTypeOf<AppNotification>().not.toHaveProperty('cnpj');
  });

  it('NotificationsResponse do painel', () => {
    expectTypeOf<NotificationsResponse['total']>().toEqualTypeOf<number>();
    expectTypeOf<
      NotificationsResponse['unreadCount']
    >().toEqualTypeOf<number>();
    expectTypeOf<NotificationsResponse['withinDays']>().toEqualTypeOf<number>();
    expectTypeOf<NotificationsResponse['results']>().toEqualTypeOf<
      AppNotification[]
    >();
  });
});
