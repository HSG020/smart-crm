import React, { useState, useEffect } from 'react'
import { Card, Select, Button, Space, List, Avatar, Tag, Typography } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, MailOutlined, CarOutlined } from '@ant-design/icons'
import { Customer } from '../types'

const { Option } = Select
const { Text } = Typography

interface CustomerMapProps {
  customers: Customer[]
  onCustomerSelect?: (customer: Customer) => void
}

interface CustomerLocation {
  customer: Customer
  address: string
  coordinates?: [number, number]
  distance?: number
}

export const CustomerMap: React.FC<CustomerMapProps> = ({
  customers,
  onCustomerSelect
}) => {
  const [selectedCity, setSelectedCity] = useState<string>()
  const [customerLocations, setCustomerLocations] = useState<CustomerLocation[]>([])
  const [mapView, setMapView] = useState<'list' | 'map'>('list')

  useEffect(() => {
    // 处理客户地址数据
    const locations: CustomerLocation[] = customers
      .filter(c => c.address)
      .map(customer => {
        // 模拟地址解析和坐标生成
        const address = customer.address!
        const coordinates: [number, number] = [
          116.404 + (Math.random() - 0.5) * 0.1, // 北京经度 ± 0.05
          39.915 + (Math.random() - 0.5) * 0.1   // 北京纬度 ± 0.05
        ]
        
        return {
          customer,
          address,
          coordinates,
          distance: Math.floor(Math.random() * 50) + 1 // 模拟距离
        }
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))

    setCustomerLocations(locations)
  }, [customers])

  // 获取城市列表
  const getCities = () => {
    const cities = new Set<string>()
    customerLocations.forEach(location => {
      // 简单提取城市名（实际应用中需要更复杂的地址解析）
      const cityMatch = location.address.match(/(北京|上海|广州|深圳|杭州|南京|武汉|成都|重庆|天津|西安|郑州|济南|青岛|大连|沈阳|哈尔滨|长春|石家庄|太原|呼和浩特|银川|兰州|乌鲁木齐|拉萨|西宁|昆明|贵阳|南宁|海口|福州|南昌|长沙|合肥)/)
      if (cityMatch) {
        cities.add(cityMatch[1])
      }
    })
    return Array.from(cities)
  }

  // 筛选指定城市的客户
  const getFilteredLocations = () => {
    if (!selectedCity) return customerLocations
    return customerLocations.filter(location => 
      location.address.includes(selectedCity)
    )
  }

  // 规划拜访路线
  const planVisitRoute = () => {
    const filteredLocations = getFilteredLocations()
    if (filteredLocations.length === 0) return

    // 简单的路线规划（实际应用中需要调用地图API）
    const route = filteredLocations
      .filter(location => location.customer.importance === 'high')
      .slice(0, 5) // 限制一天最多拜访5个客户

    console.log('今日拜访路线：', route.map(l => l.customer.name))
    // 这里可以集成地图API生成实际路线
  }

  const filteredLocations = getFilteredLocations()
  const cities = getCities()

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap>
          <Select
            placeholder="选择城市"
            style={{ width: 120 }}
            value={selectedCity}
            onChange={setSelectedCity}
            allowClear
          >
            {cities.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>

          <Button 
            type="primary" 
            icon={<CarOutlined />}
            onClick={planVisitRoute}
            disabled={filteredLocations.length === 0}
          >
            规划路线
          </Button>

          <Button.Group>
            <Button 
              type={mapView === 'list' ? 'primary' : 'default'}
              onClick={() => setMapView('list')}
            >
              列表视图
            </Button>
            <Button 
              type={mapView === 'map' ? 'primary' : 'default'}
              onClick={() => setMapView('map')}
            >
              地图视图
            </Button>
          </Button.Group>

          <Text type="secondary">
            共 {filteredLocations.length} 个客户
          </Text>
        </Space>
      </Card>

      {/* 地图视图 */}
      {mapView === 'map' ? (
        <Card title="客户分布地图">
          <div style={{ 
            height: '500px', 
            background: 'linear-gradient(45deg, #f0f2f5 25%, transparent 25%), linear-gradient(-45deg, #f0f2f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f2f5 75%), linear-gradient(-45deg, transparent 75%, #f0f2f5 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #d9d9d9',
            borderRadius: '6px'
          }}>
            <div style={{ textAlign: 'center', color: '#999' }}>
              <EnvironmentOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>地图功能开发中</div>
              <div style={{ fontSize: '14px' }}>将集成百度地图/高德地图API</div>
              <div style={{ fontSize: '12px', marginTop: '16px' }}>
                功能预览：
                <br />• 客户位置标记
                <br />• 拜访路线规划
                <br />• 距离计算
                <br />• 实时导航
              </div>
            </div>
          </div>
        </Card>
      ) : (
        /* 列表视图 */
        <Card title={`客户位置列表 (${selectedCity || '全部城市'})`}>
          {filteredLocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <EnvironmentOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>暂无客户地址信息</div>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredLocations}
              renderItem={(location, index) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: '1px solid #f0f0f0'
                  }}
                  onClick={() => onCustomerSelect?.(location.customer)}
                  actions={[
                    <Button 
                      type="text" 
                      icon={<PhoneOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`tel:${location.customer.phone}`)
                      }}
                    />,
                    <Button 
                      type="text" 
                      icon={<MailOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (location.customer.email) {
                          window.open(`mailto:${location.customer.email}`)
                        }
                      }}
                    />,
                    <Button 
                      type="text" 
                      icon={<CarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        // 打开地图应用导航
                        const address = encodeURIComponent(location.address)
                        window.open(`https://uri.amap.com/navigation?to=${address}`)
                      }}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ position: 'relative' }}>
                        <Avatar style={{ backgroundColor: '#1890ff' }}>
                          {location.customer.name.charAt(0)}
                        </Avatar>
                        <div style={{ 
                          position: 'absolute', 
                          top: '-5px', 
                          right: '-5px',
                          backgroundColor: '#52c41a',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {location.customer.name}
                        </span>
                        <Tag color={
                          location.customer.importance === 'high' ? 'red' :
                          location.customer.importance === 'medium' ? 'orange' : 'blue'
                        }>
                          {location.customer.importance === 'high' ? '高' :
                           location.customer.importance === 'medium' ? '中' : '低'}
                        </Tag>
                        {location.distance && (
                          <Tag color="green">
                            {location.distance}km
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '4px' }}>
                          <Text strong>{location.customer.company}</Text>
                          <span style={{ marginLeft: '8px', color: '#666' }}>
                            {location.customer.position}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <EnvironmentOutlined style={{ marginRight: '4px' }} />
                          {location.address}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          <PhoneOutlined style={{ marginRight: '4px' }} />
                          {location.customer.phone}
                          {location.customer.email && (
                            <>
                              <span style={{ margin: '0 8px' }}>|</span>
                              <MailOutlined style={{ marginRight: '4px' }} />
                              {location.customer.email}
                            </>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}
    </div>
  )
}