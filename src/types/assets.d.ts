// File .svg được metro.config.js biến thành component (react-native-svg-transformer)
declare module "*.svg" {
    import type { FC } from "react";
    import type { SvgProps } from "react-native-svg";
    const content: FC<SvgProps>;
    export default content;
}

// Ảnh bitmap import qua metro trả về id tài nguyên, đưa thẳng vào <Image source={...} />
declare module "*.png" {
    const content: number;
    export default content;
}

declare module "*.jpg" {
    const content: number;
    export default content;
}
