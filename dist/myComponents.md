
## Textarea
```js
      const Textarea = defineComponent({
        props:{modelValue:String|Number,validation:Function},
        emits:['update:modelValue'],
        setup(props,{emit}){
          const message = ref('')
          const validation = props.validation || function(){return true}

          const validate=(val)=>{
            if(validation(val)){
              message.value = ''
              emit('update:modelValue',val)
            }else{
              message.value = '入力値が正しくありません'
            }
          }

          return {message,validate}
        },
        template:`
        <div>
          <div class=" text-lg font-bold"><slot></slot></div>
          <textarea :value="modelValue" @input="validate($event.target.value)"
          class="w-full"
          ></textarea>
          <p class="text-red-200"> {{ message }}</p>
        </div>
        `
      })
```

## TableFormatter
```js
      const TableFormatter = defineComponent({
        props:{columns:Array},
        setup(props,{emit,expose}){
          const textValue = ref('')
          
          const message = ref('')

          const items = computed(()=>{
            if(!textValue.value)return []

            const values = textValue.value.split('\n').map(row=>row.split('\t'))
            const header = values.shift()
            if(!Array.isArray(header)){
              message.value='テーブルデータを貼り付けてください'
            }
                        
            const raw_items = values.map(row=>{
              return header.reduce((item,colName,idx)=>{
                return Object.assign(item,{[colName]:row[idx]})
              },{})
            })

            if(!props.columns){
              return row_items
            }else{
              return raw_items.map(item=>{
                return props.columns.reduce((acc,colName)=>{
                  return Object.assign(acc,{[colName]:item[colName]})
                },{})
              })
            }
          })

          const columns = computed(()=>{
            return items.value.length? Object.keys(items.value[0]):[]
          })

          return {textValue,message,columns,items}
        },
        template:`
        <div>
          <textarea v-model="textValue" class="w-full"></textarea>

          <table class="text-xs w-full my-3" :hidden="!items.length">
            <tr>
              <th v-for="colName of columns">{{colName}}</th>
            </tr>

            <tr v-for="item of items.slice(0,5)">
              <td v-for="colName of columns">
                <div>{{ item[colName] }}</div>
              </td>
            </tr>
          </table>

          <div class="flex space-x-3">
            <slot name="default" :items="items"></slot>
            <button @click="textValue=''">クリア</button>          
          </div>

          <div class=" text-xs text-red-300"> {{ message }}</div>
        </div>
        `
      })
```
