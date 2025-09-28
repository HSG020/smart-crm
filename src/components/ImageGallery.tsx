/**
 * 图片画廊示例组件
 * 展示 LazyImage 组件的使用
 */

import React from 'react'
import { Card, Row, Col } from 'antd'
import LazyImage from './LazyImage'

// 示例图片数据
const sampleImages = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
    title: '团队协作',
    alt: 'Team collaboration'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
    title: '商务会议',
    alt: 'Business meeting'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=400',
    title: '数据分析',
    alt: 'Data analysis'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    title: '团队讨论',
    alt: 'Team discussion'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
    title: '办公环境',
    alt: 'Office environment'
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400',
    title: '客户服务',
    alt: 'Customer service'
  }
]

interface ImageGalleryProps {
  images?: Array<{
    id: number
    url: string
    title: string
    alt: string
  }>
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = sampleImages
}) => {
  return (
    <div className="image-gallery">
      <Row gutter={[16, 16]}>
        {images.map((image) => (
          <Col key={image.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              cover={
                <LazyImage
                  src={image.url}
                  alt={image.alt}
                  height={200}
                  webp={true}
                  threshold={0.1}
                  rootMargin="50px"
                  onLoad={() => console.log(`Image loaded: ${image.title}`)}
                  onError={() => console.error(`Failed to load: ${image.title}`)}
                />
              }
            >
              <Card.Meta title={image.title} />
            </Card>
          </Col>
        ))}
      </Row>

      <style jsx>{`
        .image-gallery {
          padding: 20px;
        }
      `}</style>
    </div>
  )
}

export default ImageGallery