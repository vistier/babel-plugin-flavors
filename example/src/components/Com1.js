import React, { Component } from 'react'
import { Text, View, Image } from 'react-native'

export default class Example extends Component {
  render() {
    return (
      <View>
        <Text>我是控件1, 没有被替换的文件! 红色图标</Text>
        <Image
          style={{ width: 50, height: 50 }}
          source={require('src/img/forwardButton.png')}
        />
      </View>
    )
  }
}
