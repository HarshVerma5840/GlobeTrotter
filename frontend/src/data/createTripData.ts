/**
 * Static activity suggestion data for the Create Trip page.
 *
 * These are the "Curated for Tokyo" suggestions from the Stitch mockup.
 * In production, these would come from the activities API endpoint
 * filtered by the selected city.
 */

export interface ActivitySuggestion {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  imageAlt: string;
  duration: string;
  cost: string;
  /** "portrait" → aspect-[4/5], "landscape" → aspect-[4/3] */
  aspectRatio: "portrait" | "landscape";
  /** Whether the activity starts as "added" to the trip */
  initiallyAdded?: boolean;
  /** Staggered offset for masonry layout */
  offsetTop?: boolean;
}

export const TOKYO_ACTIVITIES: ActivitySuggestion[] = [
  {
    id: "senso-ji-temple",
    title: "Senso-ji Temple",
    category: "Culture",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgNDHRFudbWzAktE9cj9usp8w_9eAiZ0GzZPt07xwQGuZcoXULwZIMfuX2zXG8Dxama_hIAUaX_pufCw2DqXWkjDkj4kkxfWZpwQvMk88fPOwcckyKbe6NCtEYm_LXJ9IEAm2CjiAnRjSGckrgodzvbilgRzR_k81YcIbZtL0tL8Tl5VZY2UZoFdqjPJtYbiA6AjATgGBrVt87lvXEPOiYRt4kJcfb7aRMumISrt15dqCu-bsawIM2",
    imageAlt: "Senso-ji Temple in Tokyo",
    duration: "2 Hours",
    cost: "Complimentary",
    aspectRatio: "portrait",
  },
  {
    id: "tsukiji-food-tour",
    title: "Tsukiji Food Tour",
    category: "Gastronomy",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4zhL_-ydvnnkdTFd2LakZ3qA7qxuf28Ea2y2Si8zy_5sGEWciFpwcgU8sxMrmI1JWbmGkwWrIt7Bn3aWpk-w5RL7slLtByaR2Uec5NvRIE9r5uPl18LJyH5JQKqm4szA_fw36LqTMsip5ugf5uozkMkR42_egb2bFnxU2yjuFOrbOX74fOZdF_F-trMUrNg-8wHf26UO8qGp-Nntd2AWBuYisJ4nwko9X913pxWzBrUOmd7Q-6RX6",
    imageAlt: "Tsukiji Food Tour in Tokyo",
    duration: "4 Hours",
    cost: "$85",
    aspectRatio: "portrait",
    initiallyAdded: true,
    offsetTop: true,
  },
  {
    id: "shibuya-crossing",
    title: "Shibuya Crossing",
    category: "Experience",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAfsfM3VJZq0VOGm-83NdbId-OIxAnAfkqRwX9TW4kw8NNIpn-8EloB1cW1_dFkLSJj95Ab3MjmeHiGoP6rjjWTvTXYUnGQAei1OZWkgx_leX5nmFHAEMsHfbX6EOQfoIp2n19v0mTxS-CpBBHfjx1Gdix6cR0-rq8_Q7Z4uOomAlEYBqcGXpLVyr-M9WAJEGRq9GnYwwOrcnpIGXNnbQJbD9IK6HKN5vAD-YsLySrhs-Qsr5y_xFfs",
    imageAlt: "Shibuya Crossing in Tokyo",
    duration: "1 Hour",
    cost: "Complimentary",
    aspectRatio: "landscape",
  },
  {
    id: "shinjuku-gyoen",
    title: "Shinjuku Gyoen",
    category: "Nature",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAaelLTGWmB4t7H56uKHAPAYVOc7vjD8bGYFVvkA2dpm2FcaqltDjkJYK01dlkEDZJ1RMIITPi3X9K8fOfB1Y9crO8ziZ1oojBYVT985aK1nYgsIjJiZLBdff4los85FpXvl6IZruVQWGM6aUC8GCO9-8X1AaHCNjAnV-4WpyprIlQ7w12G8dwK4rVpst2RJXU6YDEijAgdkfoSU3jmxtNO2Y1LCArFzKtjSlUdN9MdBB2aXdgg34ph",
    imageAlt: "Shinjuku Gyoen garden in Tokyo",
    duration: "3 Hours",
    cost: "$5",
    aspectRatio: "portrait",
    offsetTop: true,
  },
];

export const TOKYO_DESTINATION = {
  name: "Tokyo, Japan",
  flag: "🇯🇵",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDTlNKhbVt8Y8_d66mUrmF1h3_xxFfYfDOMK83Nn1zvCJp4apMdxxJ_6zWe462t76jel71rrzBspgRANG1qjZ-N9fglyNB_6RJqL7S4I6acuxqQcPFp9KL7UDZHYz-tliMK6INIU9I1Zuxn65ewFDfIpxuzAYyelWs5RmT663nYE8j35UVF3wD1mhGIJB_o3xdZhlkDbciSz1Lue4SPMoz1Z_ngRDuygQe3JDpvNQWlYm66Yb8msaF",
};
