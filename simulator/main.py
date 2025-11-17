import asyncio
import random
from asyncua import ua, Server

# 공장 구조 정의
FACTORY_STRUCTURE = {
    "Line1": {
        "Machine1": {
            "speed": (3.0, 7.0),
            "temperature": (20.0, 90.0),
            "pressure": (1.0, 5.0)
        },
        "Machine2": {
            "rpm": (800, 1500),
            "torque": (10, 30)
        }
    },
    "Line2": {
        "Machine3": {
            "flow_rate": (50, 120),
            "vibration": (0.1, 5.0)
        },
        "Machine4": {
            "humidity": (10, 50),
            "temperature": (25, 80)
        }
    }
}


async def create_opcua_server():
    server = Server()
    await server.init()

    server.set_endpoint("opc.tcp://0.0.0.0:4840/factory/")
    server.set_server_name("Multi-Line OPC UA Factory Simulator")

    idx = await server.register_namespace("http://helloworld.com/opcua/factory/")

    # 전체 공장 루트
    factory = await server.nodes.objects.add_object(idx, "Factory")

    # 노드 참조 저장
    node_map = {}

    # 구조적으로 OPC UA Node 생성
    for line_name, machines in FACTORY_STRUCTURE.items():
        line_node = await factory.add_object(idx, line_name)
        node_map[line_name] = {}

        for machine_name, props in machines.items():
            machine_node = await line_node.add_object(idx, machine_name)
            node_map[line_name][machine_name] = {}

            for prop_name, (min_v, max_v) in props.items():
                var_node = await machine_node.add_variable(idx, prop_name, 0.0)
                await var_node.set_writable()  # 클라이언트 write 가능
                node_map[line_name][machine_name][prop_name] = (
                    var_node, min_v, max_v)


    async with server:
        print("Multi-Line OPC UA Server Running at opc.tcp://localhost:4840/factory")

        while True:
            # 랜덤 값 업데이트
            for line, machines in node_map.items():
                for mach, props in machines.items():
                    for prop, (node, min_v, max_v) in props.items():
                        random_value = round(random.uniform(min_v, max_v), 2)
                        await node.write_value(random_value)
                        print(f"Updated {prop} to {random_value}")

            await asyncio.sleep(random.random() * 2 + 1)


if __name__ == "__main__":
    asyncio.run(create_opcua_server())
