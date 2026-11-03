// Ba phương pháp ghi nhớ của Memio: dùng cho trang Phương pháp (chương, bộ chọn, bảng so sánh)
// và phần giới thiệu ngắn trên trang chủ.

export type MethodId = 'story' | 'numbers' | 'loci';

export type Method = {
    id: MethodId;
    name: string;           // Tên đầy đủ của phương pháp
    island: string;         // Tên hòn đảo của nó ở phần đầu trang chủ
    tone: 'mint' | 'sun' | 'sky';
    title: [string, string];
    summary: string;        // Một câu cho phần giới thiệu ngắn trên trang chủ
    lead: string;
    steps: string[];
    goodFor: string;        // Hợp để nhớ loại thông tin nào (bộ chọn, bảng so sánh)
    startWith: string;
    level: string;
    practice: { to: string; label: string };
    guide: string;
};

export const METHODS: Method[] = [
    {
        id: 'story',
        name: 'Nối thành câu chuyện',
        island: 'Câu chuyện',
        tone: 'mint',
        title: ['Nối thành', 'câu chuyện'],
        summary: 'Nối các hình thành một câu chuyện của riêng bạn, kể lại là nhớ đúng thứ tự.',
        lead: 'Nối các hình ảnh bằng một câu chuyện của riêng bạn. Khi kể lại, từng hình sẽ tự hiện ra theo đúng thứ tự.',
        steps: [
            'Nhìn và gọi tên từng hình.',
            'Tưởng tượng một hành động nối hình trước với hình sau.',
            'Giấu các hình đi rồi kể lại câu chuyện.',
        ],
        goodFor: 'Một dãy hình, đồ vật hay việc cần làm theo thứ tự',
        startWith: '4 hình',
        level: 'Dễ, nên bắt đầu từ đây',
        practice: { to: '/practice/story', label: 'Thử với 4 hình' },
        guide: '/methods/story-linking',
    },
    {
        id: 'numbers',
        name: 'Biến số thành hình',
        island: 'Con số',
        tone: 'sun',
        title: ['Biến số', 'thành hình'],
        summary: 'Mỗi chữ số có một hình (2 là thiên nga, 8 là người tuyết), dãy số thành câu chuyện.',
        lead: 'Số 2 trông như thiên nga, số 8 giống người tuyết. Đổi số thành hình, rồi dùng hình để nhớ cả một dãy số.',
        steps: [
            'Làm quen với hình của từng số từ 0 đến 9.',
            'Nối các hình theo thứ tự của dãy số.',
            'Nhớ lại các hình rồi đổi chúng về số.',
        ],
        goodFor: 'Số điện thoại, ngày tháng, mật mã',
        startWith: 'Dãy 3 chữ số',
        level: 'Vừa, cần làm quen hình của 0–9 trước',
        practice: { to: '/practice/numbers', label: 'Thử nhớ một dãy số' },
        guide: '/methods/number-shape',
    },
    {
        id: 'loci',
        name: 'Căn phòng trí nhớ',
        island: 'Không gian',
        tone: 'sky',
        title: ['Căn phòng', 'trí nhớ'],
        summary: 'Đặt mỗi điều cần nhớ vào một chỗ quen thuộc, đi lại lộ trình để tìm lại.',
        lead: 'Đặt mỗi điều cần nhớ vào một vị trí quen thuộc, rồi đi lại các vị trí ấy trong tưởng tượng để tìm lại chúng.',
        steps: [
            'Chọn vài vị trí quen và một lộ trình cố định.',
            'Đặt một hình ảnh cần nhớ vào mỗi vị trí.',
            'Đi lại đúng lộ trình để gọi tên từng hình.',
        ],
        goodFor: 'Danh sách dài, ý chính của bài học',
        startWith: '3 vị trí trong phòng',
        level: 'Thử thách, hợp khi đã quen hai cách kia',
        practice: { to: '/practice/loci', label: 'Khám phá căn phòng' },
        guide: '/methods/memory-palace',
    },
];
