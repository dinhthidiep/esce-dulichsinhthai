// Mock Comments cho ForumPage - Bao gồm replies và reactions (chỉ tim)
// Format phù hợp với PostComment interface trong ForumPage

export interface MockForumComment {
  PostCommentId: string
  FullName: string
  Content: string
  Images?: string[]
  CreatedDate: string
  Likes: Array<{
    Id?: number
    AccountId: string
    UserId?: number
    FullName?: string
    CreatedDate?: string
    ReactionType?: string
  }>
  Replies: MockForumComment[]
  AuthorId: number
  ReactionsCount: number
  UserReactionId?: number
  ParentCommentId: number | null
}

// Mock users để tạo comments
const mockUsers = [
  { Id: 1, Name: 'Quản trị viên' },
  { Id: 2, Name: 'Nguyễn Văn Host' },
  { Id: 3, Name: 'Công ty Du lịch ABC' },
  { Id: 4, Name: 'Trần Thị Tourist' },
]

// Helper để tạo comment reaction (chỉ tim)
const createLike = (userId: number, reactionId: number) => ({
  Id: reactionId,
  AccountId: String(userId),
  UserId: userId,
  FullName: mockUsers.find(u => u.Id === userId)?.Name || 'Người dùng',
  CreatedDate: new Date().toISOString(),
  ReactionType: 'Like',
})

// ========== POST 1 - Bà Nà Hills ==========
export const mockPost1Comments: MockForumComment[] = [
  {
    PostCommentId: '1',
    FullName: 'Trần Thị Tourist',
    Content: 'Cảm ơn bạn đã chia sẻ! Mình cũng đang định đi Bà Nà Hills cuối tuần này.',
    CreatedDate: '2024-11-20T11:00:00',
    AuthorId: 4,
    ReactionsCount: 5,
    UserReactionId: undefined, // User hiện tại chưa like
    ParentCommentId: null,
    Likes: [
      createLike(2, 101),
      createLike(3, 102),
      createLike(1, 103),
    ],
    Replies: [
      {
        PostCommentId: '11',
        FullName: 'Nguyễn Văn Host',
        Content: '@Trần Thị Tourist Đúng rồi! Bạn nên đi vào buổi sáng để tránh đông.',
        CreatedDate: '2024-11-20T11:30:00',
        AuthorId: 2,
        ReactionsCount: 2,
        UserReactionId: undefined,
        ParentCommentId: 1,
        Likes: [
          createLike(4, 111),
          createLike(3, 112),
        ],
        Replies: [],
      },
      {
        PostCommentId: '12',
        FullName: 'Công ty Du lịch ABC',
        Content: '@Trần Thị Tourist Mình cũng vừa đi về, view đẹp lắm! 👍',
        CreatedDate: '2024-11-20T11:45:00',
        AuthorId: 3,
        ReactionsCount: 1,
        UserReactionId: 121, // User hiện tại đã like reply này
        ParentCommentId: 1,
        Likes: [
          createLike(4, 121),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '2',
    FullName: 'Nguyễn Văn Host',
    Content: 'Rất hữu ích! Mình sẽ note lại những tips này.',
    CreatedDate: '2024-11-20T12:00:00',
    AuthorId: 2,
    ReactionsCount: 3,
    UserReactionId: 201, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 201),
      createLike(3, 202),
      createLike(1, 203),
    ],
    Replies: [],
  },
  {
    PostCommentId: '3',
    FullName: 'Trần Thị Tourist',
    Content: 'Mình đi rồi, đúng là đẹp lắm! Cáp treo view tuyệt vời.',
    CreatedDate: '2024-11-20T14:30:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 8,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 301),
      createLike(3, 302),
      createLike(1, 303),
      createLike(2, 304),
      createLike(3, 305),
    ],
    Replies: [
      {
        PostCommentId: '13',
        FullName: 'Nguyễn Văn Host',
        Content: '@Trần Thị Tourist Mình cũng thấy vậy! Cáp treo là điểm nhấn của Bà Nà.',
        CreatedDate: '2024-11-20T15:00:00',
        AuthorId: 2,
        ReactionsCount: 3,
        UserReactionId: undefined,
        ParentCommentId: 3,
        Likes: [
          createLike(4, 311),
          createLike(3, 312),
          createLike(1, 313),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '4',
    FullName: 'Công ty Du lịch ABC',
    Content: 'Bài viết rất chi tiết! Mình đã lưu lại để tham khảo cho tour sắp tới.',
    CreatedDate: '2024-11-20T15:00:00',
    AuthorId: 3,
    ReactionsCount: 4,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 401),
      createLike(1, 402),
      createLike(4, 403),
      createLike(2, 404),
    ],
    Replies: [],
  },
  {
    PostCommentId: '5',
    FullName: 'Quản trị viên',
    Content: 'Cảm ơn bạn đã chia sẻ kinh nghiệm hữu ích cho cộng đồng!',
    CreatedDate: '2024-11-20T16:00:00',
    AuthorId: 1,
    ReactionsCount: 6,
    UserReactionId: 501, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 501),
      createLike(2, 502),
      createLike(3, 503),
      createLike(4, 504),
      createLike(2, 505),
      createLike(3, 506),
    ],
    Replies: [],
  },
]

// ========== POST 2 - Cù Lao Chàm ==========
export const mockPost2Comments: MockForumComment[] = [
  {
    PostCommentId: '20',
    FullName: 'Trần Thị Tourist',
    Content: 'Cù Lao Chàm đẹp quá! Mình cũng muốn đi lặn biển.',
    CreatedDate: '2024-11-21T15:00:00',
    AuthorId: 4,
    ReactionsCount: 2,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 2001),
      createLike(3, 2002),
    ],
    Replies: [
      {
        PostCommentId: '23',
        FullName: 'Công ty Du lịch ABC',
        Content: '@Trần Thị Tourist Bạn nên đặt tour lặn biển trước, mùa này đông lắm!',
        CreatedDate: '2024-11-21T15:30:00',
        AuthorId: 3,
        ReactionsCount: 1,
        UserReactionId: undefined,
        ParentCommentId: 20,
        Likes: [
          createLike(4, 2301),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '21',
    FullName: 'Nguyễn Văn Host',
    Content: 'Hải sản ở đây tươi ngon lắm, giá cũng hợp lý nữa!',
    CreatedDate: '2024-11-21T16:20:00',
    AuthorId: 2,
    ReactionsCount: 4,
    UserReactionId: 2101, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 2101),
      createLike(3, 2102),
      createLike(1, 2103),
      createLike(4, 2104),
    ],
    Replies: [],
  },
  {
    PostCommentId: '22',
    FullName: 'Trần Thị Tourist',
    Content: 'Mình đã đi lặn biển ở đây rồi, san hô đẹp lắm! Nước trong xanh như pha lê.',
    CreatedDate: '2024-11-21T17:00:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 7,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 2201),
      createLike(3, 2202),
      createLike(1, 2203),
      createLike(2, 2204),
      createLike(3, 2205),
      createLike(1, 2206),
      createLike(2, 2207),
    ],
    Replies: [],
  },
]

// ========== POST 3 - Bảo Tàng Chăm ==========
export const mockPost3Comments: MockForumComment[] = [
  {
    PostCommentId: '30',
    FullName: 'Trần Thị Tourist',
    Content: 'Bảo tàng này rất đáng để tham quan, mình đã học được nhiều điều thú vị.',
    CreatedDate: '2024-11-22T10:15:00',
    AuthorId: 4,
    ReactionsCount: 1,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 3001),
    ],
    Replies: [],
  },
  {
    PostCommentId: '31',
    FullName: 'Nguyễn Văn Host',
    Content: 'Mình cũng đã đến đây, bộ sưu tập rất ấn tượng!',
    CreatedDate: '2024-11-22T11:00:00',
    AuthorId: 2,
    ReactionsCount: 3,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(4, 3101),
      createLike(3, 3102),
      createLike(1, 3103),
    ],
    Replies: [],
  },
  {
    PostCommentId: '32',
    FullName: 'Trần Thị Tourist',
    Content: 'Giá vé chỉ 60k thôi, rất hợp lý cho một bảo tàng chất lượng như vậy!',
    CreatedDate: '2024-11-22T12:00:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 5,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 3201),
      createLike(3, 3202),
      createLike(1, 3203),
      createLike(2, 3204),
      createLike(3, 3205),
    ],
    Replies: [],
  },
]

// ========== POST 4 - Làng Gốm ==========
export const mockPost4Comments: MockForumComment[] = [
  {
    PostCommentId: '40',
    FullName: 'Trần Thị Tourist',
    Content: 'Làm gốm vui lắm! Mình cũng đã làm được một chiếc bình xinh xắn.',
    CreatedDate: '2024-11-23T16:00:00',
    AuthorId: 4,
    ReactionsCount: 4,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 4001),
      createLike(3, 4002),
      createLike(1, 4003),
      createLike(2, 4004),
    ],
    Replies: [
      {
        PostCommentId: '43',
        FullName: 'Nguyễn Văn Host',
        Content: '@Trần Thị Tourist Mình cũng đã làm được một cái, rất vui!',
        CreatedDate: '2024-11-23T16:30:00',
        AuthorId: 2,
        ReactionsCount: 2,
        UserReactionId: undefined,
        ParentCommentId: 40,
        Likes: [
          createLike(4, 4301),
          createLike(3, 4302),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '41',
    FullName: 'Công ty Du lịch ABC',
    Content: 'Trải nghiệm này rất thú vị! Mình đã đưa khách đến đây nhiều lần.',
    CreatedDate: '2024-11-23T17:00:00',
    AuthorId: 3,
    ReactionsCount: 6,
    UserReactionId: 4101, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 4101),
      createLike(2, 4102),
      createLike(1, 4103),
      createLike(4, 4104),
      createLike(2, 4105),
      createLike(1, 4106),
    ],
    Replies: [],
  },
  {
    PostCommentId: '42',
    FullName: 'Trần Thị Tourist',
    Content: 'Mình đã làm được chiếc bình, giờ đang chờ nung và gửi về nhà. Hồi hộp quá!',
    CreatedDate: '2024-11-23T18:00:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 8,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 4201),
      createLike(3, 4202),
      createLike(1, 4203),
      createLike(2, 4204),
      createLike(3, 4205),
      createLike(1, 4206),
      createLike(2, 4207),
      createLike(3, 4208),
    ],
    Replies: [],
  },
]

// ========== POST 5 - Sơn Trà ==========
export const mockPost5Comments: MockForumComment[] = [
  {
    PostCommentId: '50',
    FullName: 'Trần Thị Tourist',
    Content: 'Sơn Trà đẹp quá! Mình đã chụp được rất nhiều ảnh đẹp.',
    CreatedDate: '2024-11-24T09:30:00',
    AuthorId: 4,
    ReactionsCount: 3,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 5001),
      createLike(3, 5002),
      createLike(1, 5003),
    ],
    Replies: [
      {
        PostCommentId: '53',
        FullName: 'Công ty Du lịch ABC',
        Content: '@Trần Thị Tourist Mình cũng chụp được nhiều ảnh đẹp lắm!',
        CreatedDate: '2024-11-24T10:00:00',
        AuthorId: 3,
        ReactionsCount: 1,
        UserReactionId: undefined,
        ParentCommentId: 50,
        Likes: [
          createLike(4, 5301),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '51',
    FullName: 'Nguyễn Văn Host',
    Content: 'Mình đã gặp vooc chà vá chân nâu ở đây, rất đáng yêu!',
    CreatedDate: '2024-11-24T10:00:00',
    AuthorId: 2,
    ReactionsCount: 5,
    UserReactionId: 5101, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 5101),
      createLike(3, 5102),
      createLike(1, 5103),
      createLike(4, 5104),
      createLike(3, 5105),
    ],
    Replies: [],
  },
  {
    PostCommentId: '52',
    FullName: 'Trần Thị Tourist',
    Content: 'View hoàng hôn trên đảo tuyệt đẹp! Mình đã quay được video rất đẹp.',
    CreatedDate: '2024-11-24T11:00:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 9,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 5201),
      createLike(3, 5202),
      createLike(1, 5203),
      createLike(2, 5204),
      createLike(3, 5205),
      createLike(1, 5206),
      createLike(2, 5207),
      createLike(3, 5208),
      createLike(1, 5209),
    ],
    Replies: [],
  },
]

// ========== POST 6 - Mỹ Khê ==========
export const mockPost6Comments: MockForumComment[] = [
  {
    PostCommentId: '60',
    FullName: 'Trần Thị Tourist',
    Content: 'Mỹ Khê là bãi biển đẹp nhất mình từng đến!',
    CreatedDate: '2024-11-25T12:00:00',
    AuthorId: 4,
    ReactionsCount: 6,
    UserReactionId: 6001, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 6001),
      createLike(2, 6002),
      createLike(3, 6003),
      createLike(1, 6004),
      createLike(2, 6005),
      createLike(3, 6006),
    ],
    Replies: [
      {
        PostCommentId: '63',
        FullName: 'Công ty Du lịch ABC',
        Content: '@Trần Thị Tourist Đúng rồi! Mỹ Khê xứng đáng với danh hiệu bãi biển đẹp nhất thế giới!',
        CreatedDate: '2024-11-25T12:30:00',
        AuthorId: 3,
        ReactionsCount: 3,
        UserReactionId: undefined,
        ParentCommentId: 60,
        Likes: [
          createLike(4, 6301),
          createLike(2, 6302),
          createLike(1, 6303),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '61',
    FullName: 'Nguyễn Văn Host',
    Content: 'Cát trắng mịn, nước trong xanh, thật sự là thiên đường!',
    CreatedDate: '2024-11-25T13:00:00',
    AuthorId: 2,
    ReactionsCount: 7,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(4, 6101),
      createLike(3, 6102),
      createLike(1, 6103),
      createLike(4, 6104),
      createLike(3, 6105),
      createLike(1, 6106),
      createLike(2, 6107),
    ],
    Replies: [],
  },
  {
    PostCommentId: '62',
    FullName: 'Trần Thị Tourist',
    Content: 'Mình đã dành cả ngày ở đây, tắm biển và ăn hải sản. Tuyệt vời!',
    CreatedDate: '2024-11-25T14:00:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 4,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 6201),
      createLike(3, 6202),
      createLike(1, 6203),
      createLike(2, 6204),
    ],
    Replies: [],
  },
]

// ========== POST 7 - Tips tiết kiệm ==========
export const mockPost7Comments: MockForumComment[] = [
  {
    PostCommentId: '70',
    FullName: 'Trần Thị Tourist',
    Content: 'Cảm ơn bạn đã chia sẻ tips tiết kiệm! Mình cũng là sinh viên nên rất cần.',
    CreatedDate: '2024-11-26T17:00:00',
    AuthorId: 4,
    ReactionsCount: 2,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 7001),
      createLike(3, 7002),
    ],
    Replies: [
      {
        PostCommentId: '74',
        FullName: 'Quản trị viên',
        Content: '@Trần Thị Tourist Chúc bạn có chuyến đi vui vẻ và tiết kiệm!',
        CreatedDate: '2024-11-26T17:30:00',
        AuthorId: 1,
        ReactionsCount: 2,
        UserReactionId: undefined,
        ParentCommentId: 70,
        Likes: [
          createLike(4, 7401),
          createLike(2, 7402),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '71',
    FullName: 'Nguyễn Văn Host',
    Content: 'Tips rất hữu ích! Mình sẽ áp dụng cho chuyến đi sắp tới.',
    CreatedDate: '2024-11-26T18:00:00',
    AuthorId: 2,
    ReactionsCount: 5,
    UserReactionId: 7101, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 7101),
      createLike(3, 7102),
      createLike(1, 7103),
      createLike(4, 7104),
      createLike(3, 7105),
    ],
    Replies: [],
  },
  {
    PostCommentId: '72',
    FullName: 'Trần Thị Tourist',
    Content: 'Với 2 triệu mà đi được 3 ngày 2 đêm, quá hợp lý! Mình sẽ thử áp dụng.',
    CreatedDate: '2024-11-26T19:00:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 8,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 7201),
      createLike(3, 7202),
      createLike(1, 7203),
      createLike(2, 7204),
      createLike(3, 7205),
      createLike(1, 7206),
      createLike(2, 7207),
      createLike(3, 7208),
    ],
    Replies: [],
  },
  {
    PostCommentId: '73',
    FullName: 'Công ty Du lịch ABC',
    Content: 'Bài viết rất thực tế! Cảm ơn bạn đã chia sẻ.',
    CreatedDate: '2024-11-26T20:00:00',
    AuthorId: 3,
    ReactionsCount: 3,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 7301),
      createLike(1, 7302),
      createLike(4, 7303),
    ],
    Replies: [],
  },
]

// ========== POST 8 - Ẩm thực Đà Nẵng ==========
export const mockPost8Comments: MockForumComment[] = [
  {
    PostCommentId: '80',
    FullName: 'Trần Thị Tourist',
    Content: 'Mình đã thử hết 10 món rồi, đều ngon cả! Đặc biệt là mì Quảng.',
    CreatedDate: '2024-11-27T14:30:00',
    AuthorId: 4,
    ReactionsCount: 7,
    UserReactionId: 8001, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 8001),
      createLike(2, 8002),
      createLike(3, 8003),
      createLike(1, 8004),
      createLike(2, 8005),
      createLike(3, 8006),
      createLike(1, 8007),
    ],
    Replies: [
      {
        PostCommentId: '84',
        FullName: 'Quản trị viên',
        Content: '@Trần Thị Tourist Mì Quảng là đặc sản không thể bỏ qua!',
        CreatedDate: '2024-11-27T15:00:00',
        AuthorId: 1,
        ReactionsCount: 3,
        UserReactionId: undefined,
        ParentCommentId: 80,
        Likes: [
          createLike(4, 8401),
          createLike(2, 8402),
          createLike(3, 8403),
        ],
        Replies: [],
      },
      {
        PostCommentId: '85',
        FullName: 'Nguyễn Văn Host',
        Content: '@Trần Thị Tourist Mình cũng thích mì Quảng nhất! 😋',
        CreatedDate: '2024-11-27T15:15:00',
        AuthorId: 2,
        ReactionsCount: 2,
        UserReactionId: undefined,
        ParentCommentId: 80,
        Likes: [
          createLike(4, 8501),
          createLike(3, 8502),
        ],
        Replies: [],
      },
    ],
  },
  {
    PostCommentId: '81',
    FullName: 'Nguyễn Văn Host',
    Content: 'Bánh xèo và mì Quảng là 2 món mình thích nhất!',
    CreatedDate: '2024-11-27T15:00:00',
    AuthorId: 2,
    ReactionsCount: 6,
    UserReactionId: 8101, // User hiện tại đã like
    ParentCommentId: null,
    Likes: [
      createLike(4, 8101),
      createLike(3, 8102),
      createLike(1, 8103),
      createLike(4, 8104),
      createLike(3, 8105),
      createLike(1, 8106),
    ],
    Replies: [],
  },
  {
    PostCommentId: '82',
    FullName: 'Trần Thị Tourist',
    Content: 'Mình đặc biệt thích bánh tráng cuốn thịt heo, ăn hoài không chán!',
    CreatedDate: '2024-11-27T15:30:00',
    AuthorId: 4, // User hiện tại - có thể edit/delete
    ReactionsCount: 5,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 8201),
      createLike(3, 8202),
      createLike(1, 8203),
      createLike(2, 8204),
      createLike(3, 8205),
    ],
    Replies: [],
  },
  {
    PostCommentId: '83',
    FullName: 'Công ty Du lịch ABC',
    Content: 'Bún chả cá là món ăn sáng yêu thích của mình!',
    CreatedDate: '2024-11-27T16:00:00',
    AuthorId: 3,
    ReactionsCount: 4,
    UserReactionId: undefined,
    ParentCommentId: null,
    Likes: [
      createLike(2, 8301),
      createLike(1, 8302),
      createLike(4, 8303),
      createLike(2, 8304),
    ],
    Replies: [],
  },
]

// Map comments theo PostId
export const mockForumCommentsByPostId: Record<number, MockForumComment[]> = {
  1: mockPost1Comments,
  2: mockPost2Comments,
  3: mockPost3Comments,
  4: mockPost4Comments,
  5: mockPost5Comments,
  6: mockPost6Comments,
  7: mockPost7Comments,
  8: mockPost8Comments,
}

// Export tất cả comments
export const allMockForumComments: MockForumComment[] = [
  ...mockPost1Comments,
  ...mockPost2Comments,
  ...mockPost3Comments,
  ...mockPost4Comments,
  ...mockPost5Comments,
  ...mockPost6Comments,
  ...mockPost7Comments,
  ...mockPost8Comments,
]












